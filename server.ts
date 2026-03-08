import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
const SUPABASE_URL = 'https://gkkgprsflomawizioiao.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wlQ4HAA8WN4NRIUNS-DdJg_ZSYUDV9f';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Notification Helper ---
  const sendNotification = async (type: 'booking' | 'contact' | 'reminder', data: any, settings: any) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      // 1. Email Notification
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        let subject = "";
        let html = "";

        if (type === 'booking') {
          subject = `[신규 예약] ${data.themeTitle} - ${data.userName}님`;
          html = `<h3>신규 예약 내역</h3><p><b>테마:</b> ${data.themeTitle}</p><p><b>일시:</b> ${data.date} ${data.time}</p><p><b>예약자:</b> ${data.userName} (${data.userPhone})</p>`;
        } else if (type === 'contact') {
          subject = `[문의 접수] ${data.author}님의 문의`;
          html = `<h3>문의 내용</h3><p><b>작성자:</b> ${data.author}</p><p><b>내용:</b> ${data.content}</p>`;
        } else if (type === 'reminder') {
          subject = `[내일 예약 알림] ${data.themeTitle} - ${data.userName}님`;
          html = `<h3>내일 예약 안내</h3><p><b>테마:</b> ${data.themeTitle}</p><p><b>일시:</b> ${data.date} ${data.time}</p>`;
        }

        await transporter.sendMail({
          from: `"CRIME SCENERS" <${process.env.EMAIL_USER}>`,
          to: settings.managerEmail,
          subject,
          html
        });
      }

      // 2. SMS / Alimtalk (Aligo Integration Placeholder)
      // 알리고(Aligo) 가입 후 API Key를 발급받으시면 아래 주석을 해제하고 연동할 수 있습니다.
      const targetPhone = type === 'contact' ? settings.managerPhone : data.userPhone;
      const message = type === 'booking' ? settings.smsTemplates.onBooking.content : 
                      type === 'reminder' ? settings.smsTemplates.dayBefore.content : 
                      "신규 문의가 접수되었습니다.";

      console.log(`[NOTIFICATION SENT] Type: ${type}, To: ${targetPhone}, Msg: ${message}`);
      
      /* 
      // 알리고 실제 연동 예시 (axios 필요)
      if (process.env.ALIGO_KEY) {
        const formData = new URLSearchParams();
        formData.append('key', process.env.ALIGO_KEY);
        formData.append('user_id', process.env.ALIGO_ID);
        formData.append('sender', settings.managerPhone);
        formData.append('receiver', targetPhone);
        formData.append('msg', message);
        // 알림톡일 경우 endpoint와 파라미터가 달라집니다.
        await axios.post('https://apis.aligo.in/send/', formData);
      }
      */
    } catch (err) {
      console.error(`Notification failed (${type}):`, err);
    }
  };

  // API: Notify Booking
  app.post("/api/notify/booking", async (req, res) => {
    const { booking, settings } = req.body;
    await sendNotification('booking', booking, settings);
    res.json({ success: true });
  });

  // API: Notify Contact
  app.post("/api/notify/contact", async (req, res) => {
    const { inquiry, settings } = req.body;
    await sendNotification('contact', inquiry, settings);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Inject OG Tags in Dev
    app.use(async (req, res, next) => {
      if (req.url === "/" || req.url === "/index.html") {
        try {
          const { data } = await supabase.from('site_contents').select('value').eq('key', 'settings').single();
          const settings = data?.value;
          
          let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
          html = await vite.transformIndexHtml(req.url, html);
          
          if (settings?.thumbnailUrl) {
            html = html.replace(
              /<meta property="og:image" content="[^"]*">/,
              `<meta property="og:image" content="${settings.thumbnailUrl}">`
            );
          }
          
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          next(e);
        }
      } else {
        vite.middlewares(req, res, next);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    
    app.get("*", async (req, res) => {
      let html = fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf-8");
      
      try {
        const { data } = await supabase.from('site_contents').select('value').eq('key', 'settings').single();
        const settings = data?.value;
        
        if (settings?.thumbnailUrl) {
          html = html.replace(
            /<meta property="og:image" content="[^"]*">/,
            `<meta property="og:image" content="${settings.thumbnailUrl}">`
          );
        }
      } catch (e) {
        console.error("OG Injection failed", e);
      }
      
      res.send(html);
    });
  }

  // Scheduled Task: 1-day-before SMS (Runs every hour)
  setInterval(async () => {
    try {
      const { data: settingsData } = await supabase.from('site_contents').select('value').eq('key', 'settings').single();
      const settings = settingsData?.value;
      
      if (!settings?.smsTemplates?.dayBefore?.enabled) return;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: bookings, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('date', tomorrowStr)
        .eq('status', 'confirmed');

      if (error || !bookings) return;

      for (const booking of bookings) {
        await sendNotification('reminder', booking, settings);
      }
    } catch (e) {
      console.error("Scheduled task error:", e);
    }
  }, 1000 * 60 * 60); // Every hour

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

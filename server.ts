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

  // API: Notify Booking
  app.post("/api/notify/booking", async (req, res) => {
    const { booking, settings } = req.body;
    
    try {
      // 1. Send Email to Manager
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // User needs to set this
          pass: process.env.EMAIL_PASS  // User needs to set this
        }
      });

      const mailOptions = {
        from: `"CRIME SCENERS" <${process.env.EMAIL_USER}>`,
        to: settings.managerEmail,
        subject: `[신규 예약] ${booking.themeTitle} - ${booking.userName}님`,
        html: `
          <h3>신규 예약 내역</h3>
          <p><b>테마:</b> ${booking.themeTitle}</p>
          <p><b>일시:</b> ${booking.date} ${booking.time}</p>
          <p><b>예약자:</b> ${booking.userName} (${booking.userPhone})</p>
          <p><b>인원:</b> ${booking.participantCount}명</p>
          <p><b>결제방식:</b> ${booking.paymentMethod}</p>
          <p><b>요청사항:</b> ${booking.notes || '없음'}</p>
        `
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
      }

      // 2. SMS Logic (Placeholder for Aligo/CoolSMS)
      console.log(`[SMS SEND] To: ${booking.userPhone}, Content: ${settings.smsTemplates.onBooking.content}`);
      // Integration example:
      // await axios.post('https://apis.aligo.in/send/', { key: '...', user_id: '...', sender: settings.managerPhone, receiver: booking.userPhone, msg: settings.smsTemplates.onBooking.content });

      res.json({ success: true });
    } catch (error) {
      console.error("Notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // API: Notify Contact
  app.post("/api/notify/contact", async (req, res) => {
    const { inquiry, settings } = req.body;
    
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"CRIME SCENERS" <${process.env.EMAIL_USER}>`,
        to: settings.managerEmail,
        subject: `[문의 접수] ${inquiry.author}님의 문의`,
        html: `
          <h3>문의 내용</h3>
          <p><b>작성자:</b> ${inquiry.author}</p>
          <p><b>내용:</b></p>
          <p>${inquiry.content}</p>
        `
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
      }

      console.log(`[SMS SEND] To Manager: ${settings.managerPhone}, Content: 신규 문의가 접수되었습니다.`);

      res.json({ success: true });
    } catch (error) {
      console.error("Contact notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
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
        console.log(`[SCHEDULED SMS] To: ${booking.userPhone}, Content: ${settings.smsTemplates.dayBefore.content}`);
        // Integration example:
        // await axios.post('https://apis.aligo.in/send/', { ... });
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

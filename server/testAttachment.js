import "dotenv/config";
import { sendEmail } from "./utils/emailUtility.js";

async function test() {
  try {
    const res = await sendEmail({
      to: "fakecustomer@example.com", // This is not verified in Resend, so Resend API should fail on the free tier!
      subject: "Attachment Test",
      html: "<h1>Test</h1><img src=\"cid:testimg\">",
      attachments: [{
        filename: "test.png",
        content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        encoding: "base64",
        cid: "testimg"
      }]
    });
    console.log("SUCCESS", res);
  } catch(e) {
    console.error("TEST FAILED", e);
  }
}
test();

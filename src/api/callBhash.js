// callBhash.js
export async function sendWaImage({ apiBase, phone, template, params, imageUrl }) {
    // console.log(apiBase, phone, template, params, imageUrl)
    // console.log("===============================in callBhash file====================================")
    if (!apiBase) throw new Error("Missing apiBase");
    // console.log(apiBase)
    const res = await fetch(`${apiBase}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone,
            text: template,           // e.g., "site_visit_invi_img"
            paramsCsv: params,        // array or CSV string
            paramKeys: ["name", "project", "location"], // helps with date formatting if you add any later
            msgType: "textPlusImage",
            url: imageUrl
        })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "WA send failed");
    return data;
}



// export async function sendWaVideo({
//     baseUrl = "https://bhashsms.com/api/sendmsg.php",
//     user,
//     pass,
//     sender,
//     phone,
//     text,
//     params = [],
//     videoUrl,
//     priority = "wa",
//     stype = "normal",
//     htype = "video",
// }) {
//     if (!user || !pass || !sender) throw new Error("Missing bhash credentials");
//     if (!phone) throw new Error("Missing phone");
//     if (!text) throw new Error("Missing template key (text)");
//     if (!videoUrl) throw new Error("Missing videoUrl");

//     const digitsPhone = String(phone).replace(/\D/g, "");
//     const paramsCsv = params.join(","); // "Hyderabad" or "P1,P2"

//     // Build query safely
//     const q = new URLSearchParams({
//         user,
//         pass,
//         sender,
//         phone: digitsPhone,
//         text,                // template key, e.g. "radha_real_video"
//         priority,            // "wa"
//         stype,               // "normal"
//         htype,               // "video"
//         url: videoUrl,       // MUST be fully URL-encoded by URLSearchParams
//         Params: paramsCsv,   // comma separated params
//     });

//     const finalUrl = `${baseUrl}?${q.toString()}`;
//     const r = await fetch(finalUrl);
//     if (!r.ok) throw new Error(`Bhash request failed: ${r.status} ${r.statusText}`);
//     const data = await r.text(); // Bhash often returns plain text
//     // Optional: check for a success token in `data` if needed
//     return data;
// }




// callBhash.js

/**
 * Send WhatsApp TEXT + VIDEO via your Cloud Run backend.
 * Backend index.js expects:
 *  - phone, text (template key), paramsCsv (array or CSV), msgType="textPlusVideo", url=<public video URL>
 */
export async function sendWaVideo({ apiBase, phone, template, params, videoUrl }) {
    if (!apiBase) throw new Error("Missing apiBase");

    const res = await fetch(`${apiBase}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone,                  // include country code; backend strips non-digits
            text: template,         // e.g., "radha_real_video"
            paramsCsv: params,      // array OR CSV string; backend will join + sanitize
            paramKeys: ["location"],// optional: names guide sanitize rules (dates get formatted)
            msgType: "textPlusVideo",
            url: videoUrl,          // public video URL
            sanitize: true,         // backend removes spaces & unsafe chars (current behavior)
        }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "WA send failed");
    return data;
}




// existing helpers here ...

/** Send WhatsApp TEXT + PDF via your Cloud Run backend (/send). */
export async function sendWaPdf({ apiBase, phone, template, params, pdfUrl }) {
    if (!apiBase) throw new Error("Missing apiBase");
    const res = await fetch(`${apiBase}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone,                 // include country code; backend strips non-digits
            text: template,        // e.g., "milk_bill_pdf" or your key on Bhash
            paramsCsv: params,     // array OR CSV string; backend will join + sanitize
            paramKeys: ["name", "purpose", "amount", "date"], // guides sanitize + date formatting
            msgType: "textPlusPdf",
            url: pdfUrl,
            sanitize: true,
        }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "WA send failed");
    return data;
}

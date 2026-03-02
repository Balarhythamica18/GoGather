const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function calculateDiff(event) {
    let diffInHours = 0;
    const now = new Date("2026-03-02T15:57:45+05:30");

    try {
        let foundMonth = -1;
        let foundDay = -1;
        let foundYear = 2026;

        // Current buggy logic:
        const monthSource = (event.month || event.date || "").toString();
        months.forEach((m, i) => {
            if (monthSource.toLowerCase().includes(m.toLowerCase())) {
                foundMonth = i;
            }
        });

        if (event.date) {
            const dayMatch = event.date.toString().match(/\d+/);
            if (dayMatch) {
                foundDay = parseInt(dayMatch[0]);
            }
        }

        const yearMatch = (event.title || "").toString().match(/20\d{2}/);
        if (yearMatch) {
            foundYear = parseInt(yearMatch[0]);
        }

        console.log(`Current Logic: monthSource="${monthSource}", foundMonth=${foundMonth}, foundDay=${foundDay}, foundYear=${foundYear}`);

        if (foundMonth !== -1 && foundDay !== -1) {
            const eventDateTime = new Date(foundYear, foundMonth, foundDay);
            diffInHours = (eventDateTime - now) / (1000 * 60 * 60);
        }
    } catch (e) {
        console.error(e);
    }
    return diffInHours;
}

const event = {
    month: "2026-03",
    date: "13",
    title: "Global Street Food Carnival 2026",
    time: "18:00"
};

console.log("Diff in Hours (buggy):", calculateDiff(event));

function calculateDiffFixed(event) {
    let diffInHours = 0;
    const now = new Date("2026-03-02T15:57:45+05:30");

    try {
        let foundMonth = -1;
        let foundDay = -1;
        let foundYear = 2026;

        // FIXED logic:
        if (event.month && event.month.includes("-")) {
            const [y, m] = event.month.split("-");
            foundYear = parseInt(y);
            foundMonth = parseInt(m) - 1; // Month is 0-indexed in Date constructor
        } else {
            // Fallback to old logic for legacy data if any
            const monthSource = (event.month || event.date || "").toString();
            months.forEach((m, i) => {
                if (monthSource.toLowerCase().includes(m.toLowerCase())) {
                    foundMonth = i;
                }
            });
        }

        if (event.date) {
            const dayMatch = event.date.toString().match(/\d+/);
            if (dayMatch) {
                foundDay = parseInt(dayMatch[0]);
            }
        }

        if (event.month && !event.month.includes("-")) {
            const yearMatch = (event.title || "").toString().match(/20\d{2}/);
            if (yearMatch) {
                foundYear = parseInt(yearMatch[0]);
            }
        }

        console.log(`Fixed Logic: foundMonth=${foundMonth}, foundDay=${foundDay}, foundYear=${foundYear}`);

        if (foundMonth !== -1 && foundDay !== -1) {
            const timeStr = event.time ? String(event.time) : "00:00";
            const eventDateTime = new Date(foundYear, foundMonth, foundDay);
            const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (timeParts) {
                eventDateTime.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0);
            }
            diffInHours = (eventDateTime - now) / (1000 * 60 * 60);
        }
    } catch (e) {
        console.error(e);
    }
    return diffInHours;
}

console.log("Diff in Hours (fixed):", calculateDiffFixed(event));

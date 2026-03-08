import React, { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import { useLocation } from "react-router-dom";

const UserTour = () => {
    const [run, setRun] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const forceTour = urlParams.get("tour") === "true";
        const hasSeenTour = localStorage.getItem("hasSeenTour") === "true";

        // Start tour if it's forced or if the user hasn't seen it yet
        if (forceTour || !hasSeenTour) {
            const timer = setTimeout(() => {
                console.log("Starting Joyride Tour automatically...", { isMobile, forceTour, hasSeenTour });
                setRun(true);
            }, 1000); // reduced delay for better UX
            return () => clearTimeout(timer);
        }
    }, [location.pathname]); // Trigger on route change

    const steps = isMobile ? [
        {
            target: ".menu-icon",
            content: "Access all features like Events and Bookings from this menu.",
            disableBeacon: true,
        },
        {
            target: ".login-btn",
            content: "Sign in here to manage your account.",
            placement: "bottom",
        },
        {
            target: ".chatbot-trigger",
            content: "Our AI Assistant is here to help you find tickets.",
            placement: "left",
        },
    ] : [
        {
            target: ".tour-home",
            content: "Home: Your home page for GoGather.",
            disableBeacon: true,
        },
        {
            target: ".tour-events",
            content: "Events: Explore all available events.",
        },
        {
            target: ".tour-bookings",
            content: "My Bookings: View your booking details here.",
        },
        {
            target: ".tour-contact",
            content: "Contact: You can contact us anytime through this page.",
        },
        {
            target: ".login-btn",
            content: "Login: Sign in to your account and manage your details.",
            placement: "bottom",
        },
        {
            target: ".chatbot-trigger",
            content: "Our AI Assistant is here to help you find tickets.",
            placement: "left",
        },
    ];

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem("hasSeenTour", "true");
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            debug={true} // Enabled for localhost debugging
            callback={handleJoyrideCallback}
            scrollOffset={100}
            spotlightPadding={10}
            disableScrolling={false}
            styles={{
                options: {
                    arrowColor: "#fff",
                    backgroundColor: "#fff",
                    overlayColor: "rgba(0, 0, 0, 0.75)",
                    primaryColor: "#0b0f5b",
                    textColor: "#222",
                    width: 320,
                    zIndex: 10000,
                },
                tooltip: {
                    borderRadius: "16px",
                    padding: "20px",
                },
                tooltipContainer: {
                    textAlign: "left",
                },
                buttonNext: {
                    backgroundColor: "#0b0f5b",
                    borderRadius: "50px",
                    fontSize: "14px",
                    fontWeight: "700",
                    padding: "10px 20px",
                },
                buttonBack: {
                    color: "#6c757d",
                    marginRight: "10px",
                },
                buttonSkip: {
                    color: "#6c757d",
                }
            }}
            locale={{
                last: "Done",
                skip: "Skip Tour"
            }}
        />
    );
};

export default UserTour;

import React from "react";
import { useParams } from "react-router-dom";
import { allEvents } from "../data/assets";
import SeatLayout from "../components/SeatLayout/SeatLayout";

const SeatLayoutPage = () => {
  const { category, id } = useParams();

  // ✅ Find event from master array
  const event = allEvents.find((e) => {
    const matchesId = e.id === Number(id);

    if (!matchesId) return false;

    if (category === "upcoming") {
      return !!e.declaration;
    }

    if (category === "comedy") {
      return e.category?.toLowerCase() === "comedy";
    }

    if (category === "top") {
      return (
        !e.declaration &&
        e.category?.toLowerCase() !== "comedy"
      );
    }

    return false;
  });

  if (!event) {
    return (
      <h2 style={{ textAlign: "center" }}>
        Event Not Found
      </h2>
    );
  }

  return <SeatLayout event={event} />;
};

export default SeatLayoutPage;

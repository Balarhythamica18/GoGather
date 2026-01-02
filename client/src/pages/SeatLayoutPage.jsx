import React from "react";
import { useParams } from "react-router-dom";
import upcoming from "../data/events.json";
import top from "../data/topevent.json";
import comedy from "../data/comedy.json";
import SeatLayout from "../components/SeatLayout/SeatLayout";

const SeatLayoutPage = () => {
  const { category, id } = useParams();

  let data = [];

  if (category === "upcoming") data = upcoming;
  if (category === "top") data = top;
  if (category === "comedy") data = comedy;

  const event = data.find(e => e.id === Number(id));

  if (!event) {
    return <h2 style={{ textAlign: "center" }}>Event Not Found</h2>;
  }

  return <SeatLayout event={event} />;
};

export default SeatLayoutPage;

import { useState } from "react";
import "./AddShow.css";
import Title from "../../../components/Admin/Title";

const AddShow = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    date: "",
    time: "",
    location: "",
    category: "",
    ticketType: "free",
    price: "",
    seats: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Show Data:", formData);

    // future backend call
    // POST /api/admin/add-show
  };

  return (
    <div className="addshow-container">
      <Title text1="Admin" text2="Add Show" />

      <form className="addshow-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Show Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Show Description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="image"
          placeholder="Image URL"
          value={formData.image}
          onChange={handleChange}
          required
        />

        <div className="row">
          <input type="date" name="date" onChange={handleChange} required />
          <input type="time" name="time" onChange={handleChange} required />
        </div>

        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
          required
        />

        <select name="category" onChange={handleChange} required>
          <option value="">Select Category</option>
          <option value="concert">Concert</option>
          <option value="comedy">Comedy</option>
          <option value="workshop">Workshop</option>
        </select>

        <select name="ticketType" onChange={handleChange}>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        {formData.ticketType === "paid" && (
          <input
            type="number"
            name="price"
            placeholder="Ticket Price"
            onChange={handleChange}
            required
          />
        )}

        <input
          type="number"
          name="seats"
          placeholder="Total Seats"
          onChange={handleChange}
          required
        />

        <button type="submit">Add Show</button>
      </form>
    </div>
  );
};

export default AddShow;

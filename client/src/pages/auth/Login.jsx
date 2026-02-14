import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {

  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      form
    );

    localStorage.setItem("token", res.data.token);

    if (res.data.role === "admin") {
      navigate("/admin/dashboard");
    } else if (res.data.role === "organizer") {
      navigate("/organizer/dashboard");
    } else {
      navigate("/home");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email"
        onChange={(e)=>setForm({...form,email:e.target.value})} />
      <input type="password" placeholder="Password"
        onChange={(e)=>setForm({...form,password:e.target.value})} />
      <button>Login</button>
    </form>
  );
};

export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await API.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user?.name || form.name || "");
      navigate("/todos");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <>
      <div className="container auth-container">
        <h1 className="app-title">Task To-Do</h1>
        <h2>Create Account</h2>
        <p className="subtitle">Create your account to organize work and personal tasks.</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="card">
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit">Register</button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <footer className="page-footer">Task To-DO | Plan clearly. Execute confidently.</footer>
      </div>
      <div className="outside-quote">
        "A clear plan turns goals into milestones. Capture your first task and keep moving."
      </div>
    </>
  );
};

export default Register;

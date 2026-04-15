import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await API.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user?.name || "");
      navigate("/todos");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <div className="container auth-container">
        <h1 className="app-title">Task To-Do</h1>
        <h2>Sign In</h2>
        <p className="subtitle">Welcome back. Sign in to continue managing your tasks.</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="card">
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit">Login</button>
        </form>
        <p className="auth-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <footer className="page-footer">Task To-DO | Plan clearly. Execute confidently.</footer>
      </div>
      <div className="outside-quote">
        "Small progress each day builds remarkable results. Start with one task now."
      </div>
    </>
  );
};

export default Login;

import { useState } from "react";
import { Mail, Lock, User } from "react-feather";
import { useNavigate } from "react-router-dom"; // ✅ import
import "../Styles/Auth.sass";


function AuthPage({ darkMode, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate(); // ✅ for redirect

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // ✅ Login API
        const response = await fetch("http://localhost:5163/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed");

        // Store token + user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert(`Welcome back, ${data.user.userName}!`);

        // ✅ Redirect to Calendar page
        navigate("/calendar");

      } else {
        // ✅ Register API
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:5163/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Registration failed");

        alert("Registered successfully! Please login now.");

        // Switch to login page
        setIsLogin(true);

        // Clear form
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setError("");
        setLoading(false);
        return;
      }

      // Reset form
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left Side */}
        <div className="auth-left">

          <div className="app-name">
            <span className="app-highlight">Schedule</span>Pro
          </div>
          
          <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p>
            {isLogin
              ? "Welcome back! Stay on top of your schedule and never miss an important event."
              : "Create your account and take control of your calendar with ease and efficiency."}
          </p>
        </div>

        {/* Right Side */}
        <div className="auth-right">

          <div className="auth-container">
            <div className="auth-header">
              <h1>{isLogin ? "Sign In" : "Register"}</h1>
              <p>{isLogin ? "Enter your credentials" : "Fill in your details"}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-group">
                    <User className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-group">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {error && <p className="error">{error}</p>}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Register"}
              </button>
            </form>

            <div className="auth-footer">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <span
                    className="auth-link"
                    onClick={() => setIsLogin(false)}
                    style={{ cursor: "pointer" }}
                  >
                    Register
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <span
                    className="auth-link"
                    onClick={() => setIsLogin(true)}
                    style={{ cursor: "pointer" }}
                  >
                    Login
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;


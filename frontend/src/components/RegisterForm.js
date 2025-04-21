import React from "react";

function RegisterForm({ onRegister }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "20px" }}>
      <h2>Welcome!</h2>
      <p>Click below to register and view polls.</p>
      <button onClick={onRegister}>Register</button>
    </div>
  );
}

export default RegisterForm;

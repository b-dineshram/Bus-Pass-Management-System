import { useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api";

function App() {
  const [page, setPage] = useState("home");
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API}/users`);
      const data = await res.json();
      setUsers(data);
      setPage("admin");
    } catch {
      alert("Backend is not running on port 8080");
    }
  };

  return (
      <div className="app">
        <header>
          <div>
            <h1>🚌 Bus Pass Management System</h1>
            <p>Advanced Object-Oriented Programming Project</p>
          </div>

          <nav>
            <button onClick={() => setPage("home")}>Home</button>
            <button onClick={() => setPage("register")}>Register</button>
            <button onClick={() => setPage("apply")}>Apply Pass</button>
            <button onClick={() => setPage("status")}>Status</button>
            <button onClick={loadUsers}>Admin</button>
          </nav>
        </header>

        <main>
          {page === "home" && (
              <section className="hero">
                <h2>Welcome to BPMS</h2>
                <p>
                  A simple digital system for student bus pass registration,
                  application and status management.
                </p>

                <div className="cards">
                  <div onClick={() => setPage("register")}>
                    <span>👤</span>
                    <h3>Student Registration</h3>
                    <p>Register your student details.</p>
                  </div>

                  <div onClick={() => setPage("apply")}>
                    <span>🎫</span>
                    <h3>Apply for Pass</h3>
                    <p>Submit a new bus pass application.</p>
                  </div>

                  <div onClick={() => setPage("status")}>
                    <span>🔍</span>
                    <h3>Check Status</h3>
                    <p>View your bus pass application status.</p>
                  </div>

                  <div onClick={loadUsers}>
                    <span>🛠️</span>
                    <h3>Admin Dashboard</h3>
                    <p>View registered users.</p>
                  </div>
                </div>
              </section>
          )}

          {page === "register" && (
              <FormCard title="Student Registration">
                <input placeholder="Full Name" />
                <input placeholder="Email" type="email" />
                <input placeholder="Password" type="password" />
                <input placeholder="Student ID" />
                <button className="primary">Register Student</button>
              </FormCard>
          )}

          {page === "apply" && (
              <FormCard title="Bus Pass Application">
                <input placeholder="Student ID" />

                <select>
                  <option>Select Route</option>
                  <option>Saidapet → SRM Campus</option>
                  <option>Tambaram → SRM Campus</option>
                </select>

                <select>
                  <option>Select Pass Type</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>

                <button className="primary">Submit Application</button>
              </FormCard>
          )}

          {page === "status" && (
              <FormCard title="Check Pass Status">
                <input placeholder="Application ID" />
                <button className="primary">Check Status</button>

                <div className="status">
                  <strong>Status:</strong> PENDING
                </div>
              </FormCard>
          )}

          {page === "admin" && (
              <section className="panel">
                <h2>Admin Dashboard</h2>
                <p>Registered users retrieved from MySQL through JDBC.</p>

                <table>
                  <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                  </thead>

                  <tbody>
                  {users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>{user.full_name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </section>
          )}
        </main>

        <footer>
          Bus Pass Management System • Java Full-Stack Application
        </footer>
      </div>
  );
}

function FormCard({ title, children }) {
  return (
      <section className="form-card">
        <h2>{title}</h2>
        {children}
      </section>
  );
}

export default App;
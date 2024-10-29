import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  


  const axiosWithAuth = axios.create();

  const refreshToken = async () => {
    try {
      const res = await axios.post("/refresh", {
        refreshToken: user?.refreshToken,
      });
      setUser(res.data?.data);
      return res.data?.data
    } catch (err) {
      console.log(err);
    }
  };

  axiosWithAuth.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      const decodedToken = jwtDecode(user.accessToken);
      if(decodedToken.exp * 1000 < currentDate.getTime()) {
        const res = await refreshToken();
        config.headers['Authorization'] = "Bearer " + res.accessToken;
      }else{
        config.headers['Authorization'] = "Bearer " + user.accessToken;
      }
      return config;
    },
    (err) => Promise.reject(err)
  );

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/login", { username, password });
      setUser(res.data?.data);
    } catch (err) {
      console.log(err);
    }
  };


  const onDeleteHandler = async (id) => {
    setSuccess(false);
    setError(false);
    try {
      await axiosWithAuth.delete(`/users/${id}`);
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => onDeleteHandler("john")}>
            Delete John
          </button>
          <button className="deleteButton" onClick={() => onDeleteHandler("jane")}>
            Delete Jane
          </button>
          {error && (
            <span className="error">
              You are not allowed to delete this user!
            </span>
          )}
          {success && (
            <span className="success">
              User has been deleted successfully...
            </span>
          )}
        </div>
      ) : (
        <div className="login">
          <form onSubmit={submitHandler}>
            <span className="formTitle">Social Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

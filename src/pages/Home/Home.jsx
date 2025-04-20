import React from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";
import Card from "../../components/shared/Card/Card";
import Button from "../../components/shared/Button/Button";

const Home = () => {
  const navigate = useNavigate();

  function startRegister() {
    navigate("/authenticate");
  }

  // const signInLinkStyle = {
  //   color: "#0077ff",
  //   fontWeight: "bold",
  //   textDecoration: "none",
  //   marginLeft: "10px",
  // };

  return (
    <div className={styles.cardWrapper}>
      <Card title="Welcome to Flatfinity!" icon="logo">
        <p className={styles.text}>
          We’re working hard to get Flatfinity ready for everyone! While we wrap
          up the finishing touches, we’re adding people gradually to make sure
          nothing breaks.
        </p>
        <div>
          <Button onClick={startRegister} text="Let's Go" />
        </div>
        <div className={styles.signinWrapper}>
          <span className={styles.hasInvite}>Have an invite text?</span>
        </div>
      </Card>
    </div>
  );
};

export default Home;

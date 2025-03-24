"use client";
import Button from "@components/Button";


export default function Home() {

  return (
    
    <section className="home-container">
      
      <h1 className="home-title">Welcome to AI Bedtime Stories</h1>
      <p className="home-description">
        Create magical bedtime stories for your kids using AI.</p>
        <p className="home-description"> Write, listen,
        and save your favorites!
      </p>
      <div className="cta-container">
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/signup")}
        >
          Sign Up
        </Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/login")}
        >
          Login
        </Button>
        {/* <Button
          variant="secondary"
          onClick={() => (window.location.href = "/about")}
        >
          Learn More
        </Button> */}
      </div>

 {/* -------------------------REMOVE--------------------------------------- */}
      
      {/* <div className="cta-container">
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/parent/dashboard")}
        >
          Login as Parent
        </Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/child/dashboard")}
        >
          Login as Child
        </Button>
      </div> */}
    </section>
  );
}

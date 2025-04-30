import { useEffect, useState } from "react";
import { Form, Button } from 'react-bootstrap';


const CountDown = () => {
  const [eventName, setEventName] = useState(() => localStorage.getItem("eventName") || "");
  const [eventDate, setEventDate] = useState(() => localStorage.getItem("eventDate") || "");
  const [countdownStarted, setCountdownStarted] = useState(() => localStorage.getItem("countdownStarted") === "true");
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const savedTime = localStorage.getItem("timeRemaining");
    return savedTime ? parseInt(savedTime, 10) : 0;
  });
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    if (countdownStarted && eventDate) {
      const countdownInterval = setInterval(() => {
        const currentTime = new Date().getTime();
        const eventTime = new Date(eventDate).getTime();
        let remainingTime = eventTime - currentTime;

        if (remainingTime <= 0) {
          remainingTime = 0;
          clearInterval(countdownInterval);
          alert("Countdown complete!");
        }

        setTimeRemaining(remainingTime);
        localStorage.setItem("timeRemaining", remainingTime);
      }, 1000);

      setTimerInterval(countdownInterval);

      return () => clearInterval(countdownInterval);
    }
  }, [countdownStarted, eventDate]);

  const handleSetCountdown = (e) => {
    e.preventDefault(); // Prevent form submission page reload
    setCountdownStarted(true);
    localStorage.setItem("eventDate", eventDate);
    localStorage.setItem("eventName", eventName);
    localStorage.setItem("countdownStarted", "true");
  };

  const handleStopCountdown = () => {
    const isConfirmed = window.confirm("Are you sure you want to stop the countdown?");
    if (isConfirmed) {
      clearInterval(timerInterval);
      setTimerInterval(null);
      localStorage.setItem("countdownStarted", "false");
    }
  };

  const handleResetCountdown = () => {
    const isConfirmed = window.confirm("Are you sure you want to reset the countdown?");
    if (isConfirmed) {
      clearInterval(timerInterval);
      setTimerInterval(null);
      setCountdownStarted(false);
      setTimeRemaining(0);
      setEventDate("");
      setEventName("");
      localStorage.removeItem("eventDate");
      localStorage.removeItem("eventName");
      localStorage.removeItem("timeRemaining");
      localStorage.removeItem("countdownStarted");
    }
  };

  const formatDate = (date) => {
    const options = { month: "long", day: "numeric", year: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  const formatTime = (time) => {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));

    return (
      <div className="countdown-display d-flex justify-content-end gap-4">
        <div className="countdown-value text-end">
          <div className="fs-3" style={{
            background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>{days.toString().padStart(2, "0")}</div>
          <span className="small" style={{ color: '#4a148c' }}>days</span>
        </div>
        <div className="countdown-value text-end">
          <div className="fs-3" style={{
            background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>{hours.toString().padStart(2, "0")}</div>
          <span className="small" style={{ color: '#4a148c' }}>hours</span>
        </div>
        <div className="countdown-value text-end">
          <div className="fs-3" style={{
            background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>{minutes.toString().padStart(2, "0")}</div>
          <span className="small" style={{ color: '#4a148c' }}>minutes</span>
        </div>
        <div className="countdown-value text-end">
          <div className="fs-3" style={{
            background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>{seconds.toString().padStart(2, "0")}</div>
          <span className="small" style={{ color: '#4a148c' }}>seconds</span>
        </div>
      </div>
    );
  };

  return (
    <div className="countdown-timer-container mx-auto" style={{ maxWidth: '800px' }}>
      <div className="mb-3 text-end text-center-mobile">
        <h2
          className="countdown-name fw-bold"
          style={{
            background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {countdownStarted ? eventName : 'Countdown Timer'}
        </h2>
        <p className="countdown-date" style={{ color: '#4a148c' }}>
          {countdownStarted && formatDate(eventDate)}
        </p>
      </div>

      {!countdownStarted ? (
        <Form onSubmit={handleSetCountdown}>
          <Form.Group className="mb-3" controlId="eventName">
            <Form.Label>Event Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="eventDate">
            <Form.Label>Event Date</Form.Label>
            <Form.Control
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      ) : (
        <div className="control-buttons d-flex justify-content-center gap-3">
          <Button variant="outline-danger" onClick={handleStopCountdown}>
            Stop
          </Button>
          <Button variant="outline-secondary" onClick={handleResetCountdown}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};

export default CountDown;

import { useState, useEffect } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(calculateTimeLeft());

  function calculateTimeLeft(): CountdownTime {
    const now = new Date();
    const nextMonday = new Date();
    
    // Get next Monday at 8:00 AM
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // 8 = Monday next week if today is Monday
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 0, 0, 0);
    
    // If it's Monday before 8 AM, use today
    if (now.getDay() === 1 && now.getHours() < 8) {
      nextMonday.setDate(now.getDate());
    }
    
    const difference = nextMonday.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

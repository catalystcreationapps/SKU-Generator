
function startCountdown() {
  let date_time1 = new Date("July 31, 2023 23:59:59").getTime();
  const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000; // Three days in milliseconds

  const updateCountdown = () => {
    const date_time2 = new Date().getTime();
    const time_var = date_time1 - date_time2;

    if (time_var > 0) {
      const days_data = Math.floor(time_var / (1000 * 60 * 60 * 24));
      const hours_data = Math.floor(
        (time_var % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes_data = Math.floor(
        (time_var % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds_data = Math.floor((time_var % (1000 * 60)) / 1000);

      let dayElement = document.getElementById("days");
      let hourElement = document.getElementById("hours");
      let minuteElement = document.getElementById("minutes");
      let secondElement = document.getElementById("seconds");
      // let dayElement =  document.getElementById("days").innerHTML = days_data;
      // document.getElementById("hours").innerHTML = hours_data;
      // document.getElementById("minutes").innerHTML = minutes_data;
      // document.getElementById("seconds").innerHTML = seconds_data;
      // Add leading zero if value is less than 10
      const formattedDays = days_data < 10 ? `0${days_data}` : days_data;
      const formattedHours = hours_data < 10 ? `0${hours_data}` : hours_data;
      const formattedMinutes =
        minutes_data < 10 ? `0${minutes_data}` : minutes_data;
      const formattedSeconds =
        seconds_data < 10 ? `0${seconds_data}` : seconds_data;
      if (dayElement && hourElement && minuteElement && secondElement) {
        dayElement.innerHTML = formattedDays;
        hourElement.innerHTML = formattedHours;
        minuteElement.innerHTML = formattedMinutes;
        secondElement.innerHTML = formattedSeconds;
      }
    } else {
      // Time has expired, extend the date by three days
      date_time1 += threeDaysInMillis;
    }
  };

  // Call the updateCountdown function every 5 milliseconds
  var f_fun = setInterval(updateCountdown, 5);
}

export default startCountdown;

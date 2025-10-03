export async function handler(event) {
  const payload = JSON.parse(event.body);

  const res = await fetch("https://script.google.com/macros/s/AKfycbz7vg5WRokkeMBx3US2EghC4HMDZt4i7ybVwp8Sx7Sxd0MjCHrKdHx46lShY5jvVjwL5A/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": '*' },
    body: "OK"
  };
}
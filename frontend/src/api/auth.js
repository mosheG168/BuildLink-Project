import api from "./client";

function captureTokenFromHeaders(res) {
  const t = res?.headers?.["x-auth-token"];
  if (t) localStorage.setItem("token", t);
}

export async function registerUser(form) {
  const payload = {
    name: {
      first: form.first,
      middle: form.middle || "",
      last: form.last,
    },
    email: form.email,
    phone: form.phone,
    password: form.password,
    isBusiness: form.role === "contractor", // map role -> isBusiness
    address: {
      state: form.address.state,
      country: form.address.country,
      city: form.address.city,
      street: form.address.street,
      // let backend convert strings to numbers (convert:true)
      houseNumber: form.address.houseNumber,
      zip: form.address.zip,
    },
    // image omitted by design
  };

  const res = await api.post("/users/register", payload);
  captureTokenFromHeaders(res);
  if (res.data?.token) localStorage.setItem("token", res.data.token);
  return res.data;
}

export async function loginUser({ email, password }) {
  const res = await api.post("/users/login", { email, password });
  captureTokenFromHeaders(res);
  if (res.data?.token) localStorage.setItem("token", res.data.token);
  return res.data;
}

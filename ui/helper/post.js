function post(name, data = {}) {
  if (!isFiveM) return Promise.resolve();

  return fetch(`https://${GetParentResourceName()}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data),
  }).catch((e) => console.error(e));
}

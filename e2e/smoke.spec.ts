import { expect, test } from "@playwright/test";

test("la app redirige al login y muestra el formulario", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/signin/);
  await expect(
    page.getByRole("heading", { name: /bienvenido a tu cuenta/i }),
  ).toBeVisible();
  await expect(page.getByText(/correo/i).first()).toBeVisible();
});

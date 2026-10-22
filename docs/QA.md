# QA en Client-App

Guía corta para escribir pruebas y usarlas en el ciclo de desarrollo.

## Pirámide (qué probar y dónde)

```
        /\
       /  \      E2E (Playwright) — pocos: login, una ruta crítica
      /----\
     /      \    Componentes (Testing Library) — checks, formularios
    /--------\
   /          \  Unitarias (Vitest) — la mayoría: CardCode, payloads, límites
```

| Capa | Herramienta | Cuándo |
| --- | --- | --- |
| Unitaria | Vitest | Función pura: CardCode, descuentos, validaciones |
| Componente | Vitest + Testing Library | Un botón se habilita, un check se bloquea |
| E2E | Playwright | El usuario abre `/` y llega al login |

No uses Selenium. Playwright cubre el mismo rol (navegador real) con mejor DX en este stack.

Vitest corre en **happy-dom** (DOM en memoria, sin Chrome). Playwright sí abre un navegador real.

## Comandos

```bash
npm test              # una pasada (CI / antes de un PR)
npm run test:watch    # se reejecuta al guardar — úsalo mientras programas
npm run test:ui       # UI de Vitest: filtra, ves diffs
npm run test:coverage # informe HTML en coverage/
npm run qa            # lint + unitarias
npm run test:e2e      # primera vez: npx playwright install
```

## Cómo escribir una unitaria

1. Elige una función exportada (no un componente gordo).
2. Crea `NombreArchivo.test.ts` **junto** al código.
3. Usa AAA:

```ts
it("arma el CardCode de Codial con el prefijo C", () => {
  // Arrange
  const origen = "C002899";
  // Act
  const resultado = cardCodeParaCodial(origen);
  // Assert
  expect(resultado).toBe("CC002899");
});
```

Nombra el `it` con el comportamiento, no con el nombre de la función.

## Cómo escribir una de componente

Renderizas el componente, buscas por rol (accesible) y simulas clics:

```ts
const check = screen.getByRole("checkbox", { name: /codialub/i });
await user.click(check);
expect(onIdEmpresaChange).toHaveBeenCalledWith(1);
```

Si el componente llama a la API, **mockéala** (`vi.mock`). Las unitarias no deben pegarle al backend.

## Ciclo de desarrollo recomendado

1. **Reproduce o describe** el bug/regla (ej. “Codial no se habilita hasta enviar Codialub”).
2. **Escribe el test que falla** (rojo).
3. **Implementa lo mínimo** para que pase (verde).
4. **Limpia** sin romper el test (refactor).
5. En el PR, `npm run qa` debe pasar. GitHub Actions (`.github/workflows/qa.yml`) lo vuelve a correr.

Eso es control de ciclo: el test documenta la regla de negocio y evita regresiones (como mezclar descuentos de Codialub con Codial).

## Qué no hace falta testear

- Estilos Tailwind pixel a pixel.
- Librerías de terceros.
- Cada pantalla con Playwright (es lento y frágil).
- Detalles privados no exportados; prueba el contrato público.

## Siguiente paso

Cuando toques una regla de CRM (CardCode, SAP, descuentos), agrega un caso en:

- `src/components/CRM/prospectoFormUtils.test.ts`
- `src/components/CRM/clienteAltaUtils.descuentos.test.ts`
- `src/components/CRM/TabDescuentosCliente.test.tsx`

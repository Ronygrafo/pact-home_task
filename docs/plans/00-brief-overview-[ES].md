# 00 · Brief — Overview en claro

> Documento de consulta personal (en español). Es el enunciado de la prueba reformulado sin ambigüedades, más el original literal en el apéndice. **Todo lo que se entrega a Pact va en inglés.**

---

## Datos clave

| | |
|---|---|
| **Puesto** | Senior Shopify Developer |
| **Empresa** | Pact Studio |
| **Tipo** | Take-home task (prueba técnica para llevar a casa) |
| **Cliente ficticio** | Marca DTC de lifestyle en **Shopify Plus** |
| **Plazo** | **3 días hábiles** desde que se recibe |
| **Entrega** | Pestaña *"Submit your work"* de la plataforma |

---

## Resumen en 5 líneas

El cliente tiene una **app de pago de cross-sell** en su página de producto. Le ralentiza la página y funciona de forma inconsistente. Quiere **eliminarla** y sustituirla por una **sección custom** hecha a medida: rápida, con aspecto premium, y que puedan enseñar con confianza a sus stakeholders. Hay que construir ese widget, documentarlo y presentarlo.

---

## 1 · La situación (contexto del cliente)

- Es un cliente de Pact: marca **DTC de lifestyle** sobre **Shopify Plus**.
- Hoy usa una **app de cross-sell de pago** en la página de producto.
- Problemas concretos que declaran:
  1. **Ralentiza la página.**
  2. **Se comporta de forma inconsistente.**
- Lo que quieren en su lugar: una **sección de cross-sell custom** que sea
  - **premium** en su acabado,
  - **rápida** en carga,
  - y **presentable ante stakeholders** sin miedo a que falle.

---

## 2 · Qué hay que construir

Un **widget de cross-sell para la página de producto**. Requisitos, literales y sin interpretación:

| # | Requisito |
|---|---|
| **R1** | El equipo de la tienda debe poder **elegir manualmente** qué productos aparecen **para cada producto**. |
| **R2** | Debe aparecer en la página de producto, **justo debajo del botón "Add to Cart"**. |
| **R3** | El comprador debe poder **añadir un producto al carrito directamente desde el widget**. |
| **R4** | Debe **parecerse al diseño de referencia** todo lo posible. |

### El diseño de referencia

Carrusel titulado **"PAIRS WITH"**, situado debajo del botón de Add to Cart. Cada producto se muestra en una tarjeta con:

- imagen del producto,
- nombre,
- precio,
- **selector de talla**,
- botón **ADD**.

*(Especificación visual detallada extraída de la imagen → [design-tokens.md](../design-tokens.md))*

---

## 3 · Qué hay que entregar

Son **tres cosas**, las tres obligatorias:

### A · Write-up técnico (documento breve)
Explicando:
- el **enfoque técnico**,
- **qué features de Shopify** se usarían,
- **cómo se ha pensado el rendimiento**.

### B · Prototipo front-end funcional
- Un **repositorio de GitHub**, **más**
- un **enlace a demo en vivo o sandbox**.

*(Son dos enlaces, no uno: repo + demo funcionando.)*

### C · Update para el cliente (vídeo)
Formato sugerido por ellos: **Loom**. Debe recorrer:
- el enfoque,
- **cómo funciona el widget**,
- **cómo se asignan los productos**,
- y una **demo rápida**.

*(Es una pieza orientada al cliente, no al desarrollador.)*

---

## 4 · Plazo y envío

- **3 días hábiles** desde la recepción del enunciado.
- Al terminar: ir a la pestaña **"Submit your work"** y pegar los enlaces.

---

## 5 · Nota explícita del enunciado

> *"Si algo no está claro, pregunta antes de empezar. Preferimos con mucho responder una pregunta a que tengas que adivinar."*

**No es una fórmula de cortesía: es parte de lo que se evalúa.** Preguntar el día 1 puntúa; asumir en silencio, no.

También dicen que la prueba **"está cerca del trabajo real que harías para los clientes de Pact, así que trátala como si lo fuera"** — es decir, se juzga también el acabado profesional: repo, documentación, comunicación.

---

## 6 · Checklist mínima de "está entregado"

- [ ] Preguntas enviadas antes de empezar
- [ ] R1 · asignación manual de productos por producto
- [ ] R2 · posicionado bajo el Add to Cart
- [ ] R3 · añadir al carrito desde el widget
- [ ] R4 · fidelidad al diseño
- [ ] A · write-up técnico
- [ ] B · repo de GitHub + enlace a demo en vivo
- [ ] C · Loom para cliente
- [ ] Enlaces pegados en "Submit your work"

---

## Documentos de este proyecto

| Doc | Contenido | Idioma | ¿En el repo? |
|---|---|---|---|
| **plans/00-brief-overview-[ES].md** | Este documento — el enunciado en claro | ES | Sí |
| [plans/01-delivery-checklist.md](01-delivery-checklist.md) | Checklist operativa de ejecución y QA | EN | Sí |
| [plans/cross-sell-widget.md](cross-sell-widget.md) | Plan de implementación del widget | EN | Sí |
| [features/cross-sell-widget.md](../features/cross-sell-widget.md) | Documentación de la feature (overview + referencia técnica) | EN | Sí |
| [design-tokens.md](../design-tokens.md) | Especificación visual y tokens CSS | EN | Sí |
| **private/02-strategic-recommendations.md** | Lectura entre líneas y criterios de evaluación | EN | **No — único gitignored** |

---

<details>
<summary><strong>Apéndice · Texto original literal (inglés)</strong></summary>

**Take-home task — Senior Shopify Developer · Pact Studio**

Hi, and thanks for making it to this stage. This is a short build task for the role. It's close to the actual work you'd be doing for Pact's clients, so please treat it like the real thing.

**The situation**

One of Pact's clients is a Shopify Plus DTC lifestyle brand. They're running a paid cross-sell app on their product pages, but it's slowing the page down and behaving inconsistently. They want to drop it and have a custom cross-sell section built instead, something that feels premium, loads fast, and they can confidently demo to their stakeholders.

**What we'd like you to build**

A custom cross-sell widget for the product page. It needs to:

- Let the store team manually choose which products show up for each product.
- Appear on the product page, right below the "Add to Cart" button.
- Let shoppers add a product to cart directly from the widget.

Please match this design as closely as you can:

Cross-sell widget: a 'Pairs With' carousel below the Add to Cart button, each product showing an image, name, price, a size selector and an Add button.
*Reference design for the widget.*

**What to send back**

Three things:

- A short write-up of your technical approach, which Shopify features you'd use and how you thought about performance.
- A working front-end prototype of the widget (a GitHub repo, plus a live demo or sandbox link).
- A short client-facing update walking us through your approach, how the widget works, how products get assigned, and a quick demo. A Loom is perfect for this.

**Timeline**

You've got 3 business days from the day you receive this. When you're done, head to the "Submit your work" tab and drop in your links.

One last thing: if anything's unclear, just ask before you start. We'd much rather answer a question than have you guess. Good luck, we're looking forward to seeing what you build.

</details>

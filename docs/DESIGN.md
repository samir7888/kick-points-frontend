# Design decisions

## Direction

Tally helps Kick viewers configure automatic prediction votes once and check results quickly. The outcome split bar is the signature element; cards, labels, and motion remain quiet.

## Palette and type

The accent family was moved from teal to a green inspired by Kick's own tokens (requested by the product owner). Surfaces are unchanged, so the app does not take on Kick's dark/acid-green identity wholesale:

- `--brand` / `--brand-foreground`: the filled-action color `#53fc18` (Kick "volt green") with near-black `#090b0f` text. Used only for the primary button, where the dark-on-green pair reaches 13.6:1 in both themes.
- `--primary`: the accent/text token. Light mode uses a darkened green `#0e7704` (5.1:1 on Fog) because `#53fc18` is unreadable as text on light surfaces; dark mode uses `#53fc18` directly (13.6:1 on the dark background).
- Surfaces, muted text and status colors (`amber`, `win`, `loss`) are unchanged from the Tide palette, since Kick's bright status hues fail AA as light-mode text.

Other references are Fog `#EEF2F4`, Ink `#0F1F26`, Amber `#F2A31B`, Win `#2E9E5B`, Loss `#D64550`; dark mode uses `#0B1418` and `#12202A`. Tokens are in `app/globals.css`. Bricolage Grotesque is used for display; Instrument Sans for body. Numeric values use tabular figures.

## Review

The green accent is a deliberate, product-owner-approved deviation from the original brief, which avoided Kick's dark/acid-green look to reduce brand-imitation risk. The change is limited to the accent/button tokens; every other token and the type pairing are retained, and the app still states it is "not affiliated with Kick". Flat borders encode grouping; only dialogs and floating controls should use shadows. Reduced motion disables transitions and animations when requested.

## UI components

`components.json` is configured for the shadcn New York style. Shared UI pieces use Tailwind and Radix primitives with shadcn-compatible CSS variables.

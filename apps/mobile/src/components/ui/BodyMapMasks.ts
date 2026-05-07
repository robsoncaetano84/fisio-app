export type BodySide = "esquerdo" | "direito" | "ambos";
export type BodyView = "anterior" | "posterior";
export type BodyVariant = "masculino" | "feminino";
export type BodyMapShapeKind = "ellipse" | "path" | "rect";

export type BodyMapShape = {
  shape: BodyMapShapeKind;
  props: Record<string, number | string>;
};

export type BodyMapMask = {
  key: string;
  regiao: string;
  vista: BodyView;
  lado: BodySide;
  visual: BodyMapShape[];
  touch: BodyMapShape[];
};

type ShapeAdjust = {
  anteriorDx?: number;
  posteriorDx?: number;
  dy?: number;
  rxScale?: number;
  ryScale?: number;
};

export const BODY_MAP_DIMENSIONS: Record<
  BodyVariant,
  { width: number; height: number }
> = {
  masculino: { width: 870, height: 904 },
  feminino: { width: 870, height: 904 },
};

export const BODY_VIEWBOX = {
  width: 870,
  height: 904,
};

export const BODY_HALF_WIDTH = BODY_VIEWBOX.width / 2;

const path = (d: string): BodyMapShape => ({
  shape: "path",
  props: { d },
});

const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): BodyMapShape => ({
  shape: "ellipse",
  props: { cx, cy, rx, ry },
});

const mask = (
  key: string,
  regiao: string,
  vista: BodyView,
  lado: BodySide,
  visual: BodyMapShape | BodyMapShape[],
  _touch?: BodyMapShape | BodyMapShape[],
): BodyMapMask => {
  const visualShapes = Array.isArray(visual) ? visual : [visual];
  const touchShapes = _touch
    ? Array.isArray(_touch)
      ? _touch
      : [_touch]
    : visualShapes;
  return {
    key,
    regiao,
    vista,
    lado,
    visual: visualShapes,
    touch: touchShapes,
  };
};

const MASCULINO_REGION_MASKS_RAW: BodyMapMask[] = [
  mask("posterior-cabeca", "cabeca", "posterior", "ambos", ellipse(257, 89, 47, 58)),
  mask(
    "posterior-cervical",
    "coluna_cervical",
    "posterior",
    "ambos",
    path("M225 132 C238 122 275 122 290 134 L281 220 C268 230 247 230 234 220 Z"),
  ),
  mask(
    "posterior-ombro-esquerdo",
    "ombro",
    "posterior",
    "esquerdo",
    path("M134 187 C158 170 205 172 231 194 C210 211 172 220 138 211 C125 207 123 196 134 187 Z"),
    path("M120 185 C142 158 202 155 238 190 C215 221 170 240 127 222 C110 214 105 200 120 185 Z"),
  ),
  mask(
    "posterior-ombro-direito",
    "ombro",
    "posterior",
    "direito",
    path("M386 187 C362 170 315 172 289 194 C310 211 348 220 382 211 C395 207 397 196 386 187 Z"),
    path("M400 185 C378 158 318 155 282 190 C305 221 350 240 393 222 C410 214 415 200 400 185 Z"),
  ),
  mask(
    "posterior-braco-esquerdo",
    "braco",
    "posterior",
    "esquerdo",
    path("M112 237 C134 232 150 260 151 313 C151 358 134 396 111 392 C91 389 88 340 96 294 C100 267 104 246 112 237 Z"),
    path("M102 232 C128 226 154 250 158 314 C158 372 136 419 108 415 C83 412 75 352 86 291 C90 266 94 246 102 232 Z"),
  ),
  mask(
    "posterior-braco-direito",
    "braco",
    "posterior",
    "direito",
    path("M408 237 C386 232 370 260 369 313 C369 358 386 396 409 392 C429 389 432 340 424 294 C420 267 416 246 408 237 Z"),
    path("M418 232 C392 226 366 250 362 314 C362 372 384 419 412 415 C437 412 445 352 434 291 C430 266 426 246 418 232 Z"),
  ),
  mask(
    "posterior-cotovelo-esquerdo",
    "cotovelo",
    "posterior",
    "esquerdo",
    ellipse(101, 423, 18, 24),
    ellipse(98, 425, 25, 35),
  ),
  mask(
    "posterior-cotovelo-direito",
    "cotovelo",
    "posterior",
    "direito",
    ellipse(419, 423, 18, 24),
    ellipse(421, 425, 25, 35),
  ),
  mask(
    "posterior-punho-mao-esquerdo",
    "punho_mao",
    "posterior",
    "esquerdo",
    path("M105 425 L134 425 C135 438 134 451 132 463 C138 471 140 486 137 498 C134 511 125 512 122 503 C120 521 111 528 107 514 C103 529 94 526 93 511 C87 516 81 508 84 495 C79 485 81 474 90 466 C80 470 70 467 69 459 C69 450 82 440 97 438 C98 432 101 427 105 425 Z"),
  ),
  mask(
    "posterior-punho-mao-direito",
    "punho_mao",
    "posterior",
    "direito",
    path("M392 425 L363 425 C362 438 363 451 365 463 C359 471 357 486 360 498 C363 511 372 512 375 503 C377 521 386 528 390 514 C394 529 403 526 404 511 C410 516 416 508 413 495 C418 485 416 474 407 466 C417 470 427 467 428 459 C428 450 415 440 400 438 C399 432 396 427 392 425 Z"),
  ),
  mask(
    "posterior-costas",
    "torax",
    "posterior",
    "ambos",
    [
      path("M151 199 C174 190 216 193 245 207 C234 259 226 319 231 389 C222 424 201 446 176 439 C151 432 139 400 141 353 C143 292 139 226 151 199 Z"),
      path("M369 199 C346 190 304 193 275 207 C286 259 294 319 289 389 C298 424 319 446 344 439 C369 432 381 400 379 353 C377 292 381 226 369 199 Z"),
    ],
    [
      path("M128 185 C158 174 218 178 256 195 C242 258 231 333 237 409 C224 453 197 478 163 468 C128 458 108 421 109 356 C110 287 113 220 128 185 Z"),
      path("M392 185 C362 174 302 178 264 195 C278 258 289 333 283 409 C296 453 323 478 357 468 C392 458 412 421 411 356 C410 287 407 220 392 185 Z"),
    ],
  ),
  mask(
    "posterior-toracica",
    "coluna_toracica",
    "posterior",
    "ambos",
    path("M241 207 C252 200 268 200 279 207 L282 411 C269 421 251 421 238 411 Z"),
  ),
  mask(
    "posterior-lombar",
    "coluna_lombar",
    "posterior",
    "ambos",
    path("M235 407 C249 397 271 397 285 407 L292 494 C276 506 246 506 230 494 Z"),
  ),
  mask(
    "posterior-coxofemoral-esquerdo",
    "coxofemoral",
    "posterior",
    "esquerdo",
    path("M148 412 C176 398 222 405 250 435 C250 468 226 494 194 506 C162 501 139 475 142 451 C143 436 145 420 148 412 Z"),
  ),
  mask(
    "posterior-coxofemoral-direito",
    "coxofemoral",
    "posterior",
    "direito",
    path("M268 412 C296 398 327 405 345 435 C344 468 326 494 300 506 C274 501 256 475 260 451 C263 436 264 420 268 412 Z"),
  ),
  mask(
    "posterior-coxa-esquerda",
    "posterior_coxa",
    "posterior",
    "esquerdo",
    path("M160 505 C190 485 230 495 245 545 C246 575 225 605 202 612 C172 612 148 580 150 535 C151 520 154 510 160 505 Z"),
    path("M160 505 C190 485 230 495 245 545 C244 568 225 590 203 596 C174 596 149 572 150 535 C151 520 154 510 160 505 Z"),
  ),
  mask(
    "posterior-coxa-direita",
    "posterior_coxa",
    "posterior",
    "direito",
    path("M329 505 C299 485 260 495 250 545 C251 575 271 605 293 612 C323 612 339 580 335 535 C334 520 333 510 329 505 Z"),
    path("M329 505 C299 485 260 495 250 545 C251 568 271 590 293 596 C322 596 338 572 335 535 C334 520 333 510 329 505 Z"),
  ),
  mask(
    "posterior-joelho-esquerdo",
    "popliteo",
    "posterior",
    "esquerdo",
    ellipse(202, 640, 34, 30),
    ellipse(202, 640, 42, 38),
  ),
  mask(
    "posterior-joelho-direito",
    "popliteo",
    "posterior",
    "direito",
    ellipse(286, 640, 34, 30),
    ellipse(286, 640, 42, 38),
  ),
  mask(
    "posterior-panturrilha-esquerda",
    "panturrilha",
    "posterior",
    "esquerdo",
    path("M170 662 C193 644 226 655 235 704 C237 765 221 813 196 815 C168 817 153 768 157 706 C159 684 163 670 170 662 Z"),
    path("M170 662 C193 644 226 655 235 704 C237 765 221 813 196 815 C168 817 153 768 157 706 C159 684 163 670 170 662 Z"),
  ),
  mask(
    "posterior-panturrilha-direita",
    "panturrilha",
    "posterior",
    "direito",
    path("M310 662 C293 644 268 655 260 704 C258 765 270 811 294 815 C314 812 321 758 318 706 C317 684 314 670 310 662 Z"),
    path("M310 662 C293 644 268 655 260 704 C258 765 270 811 294 815 C314 812 321 758 318 706 C317 684 314 670 310 662 Z"),
  ),
  mask(
    "posterior-tornozelo-pe-esquerdo",
    "tornozelo_pe",
    "posterior",
    "esquerdo",
    path("M146 820 C169 809 211 810 228 830 C231 851 218 874 192 878 C165 881 141 866 138 844 C137 834 140 825 146 820 Z"),
  ),
  mask(
    "posterior-tornozelo-pe-direito",
    "tornozelo_pe",
    "posterior",
    "direito",
    path("M290 820 C313 809 355 810 372 830 C375 851 362 874 336 878 C309 881 285 866 282 844 C281 834 284 825 290 820 Z"),
  ),
  mask("anterior-cabeca", "cabeca", "anterior", "ambos", ellipse(632, 89, 46, 58)),
  mask(
    "anterior-pescoco",
    "pescoco",
    "anterior",
    "ambos",
    path("M594 134 C610 124 654 124 670 134 L666 213 C650 224 614 224 598 213 Z"),
  ),
  mask(
    "anterior-ombro-esquerdo",
    "ombro",
    "anterior",
    "esquerdo",
    path("M774 190 C748 158 686 162 661 197 C686 225 729 240 770 221 C789 212 792 199 774 190 Z"),
  ),
  mask(
    "anterior-ombro-direito",
    "ombro",
    "anterior",
    "direito",
    path("M490 190 C516 158 578 162 603 197 C578 225 535 240 494 221 C475 212 472 199 490 190 Z"),
  ),
  mask(
    "anterior-braco-esquerdo",
    "braco",
    "anterior",
    "esquerdo",
    path("M791 232 C764 226 738 253 734 319 C734 377 757 423 784 418 C809 414 816 352 806 292 C802 267 798 246 791 232 Z"),
  ),
  mask(
    "anterior-braco-direito",
    "braco",
    "anterior",
    "direito",
    path("M473 232 C500 226 526 253 530 319 C530 377 507 423 480 418 C455 414 448 352 458 292 C462 267 466 246 473 232 Z"),
  ),
  mask("anterior-cotovelo-esquerdo", "cotovelo", "anterior", "esquerdo", ellipse(807, 430, 25, 35)),
  mask("anterior-cotovelo-direito", "cotovelo", "anterior", "direito", ellipse(467, 430, 25, 35)),
  mask(
    "anterior-punho-mao-esquerdo",
    "punho_mao",
    "anterior",
    "esquerdo",
    path("M770 425 L741 425 C740 438 741 451 743 463 C737 471 735 486 738 498 C741 511 750 512 753 503 C755 521 764 528 768 514 C772 529 781 526 782 511 C788 516 794 508 791 495 C796 485 794 474 785 466 C795 470 805 467 806 459 C806 450 793 440 778 438 C777 432 774 427 770 425 Z"),
  ),
  mask(
    "anterior-punho-mao-direito",
    "punho_mao",
    "anterior",
    "direito",
    path("M478 425 L507 425 C508 438 507 451 505 463 C511 471 513 486 510 498 C507 511 498 512 495 503 C493 521 484 528 480 514 C476 529 467 526 466 511 C460 516 454 508 457 495 C452 485 454 474 463 466 C453 470 443 467 442 459 C442 450 455 440 470 438 C471 432 474 427 478 425 Z"),
  ),
  mask(
    "anterior-torax",
    "torax",
    "anterior",
    "ambos",
    path("M532 206 C568 168 696 168 733 206 C728 286 695 360 632 363 C570 360 537 286 532 206 Z"),
  ),
  mask(
    "anterior-abdomen",
    "abdomen",
    "anterior",
    "ambos",
    path("M558 340 C590 320 674 320 706 340 L694 496 C671 533 594 533 571 496 Z"),
  ),
  mask(
    "anterior-coxofemoral-esquerdo",
    "coxofemoral",
    "anterior",
    "esquerdo",
    path("M730 405 C706 397 666 406 642 435 C642 462 662 484 690 490 C716 486 734 466 734 444 C734 428 732 412 730 405 Z"),
  ),
  mask(
    "anterior-coxofemoral-direito",
    "coxofemoral",
    "anterior",
    "direito",
    path("M532 405 C556 397 596 406 620 435 C620 462 600 484 572 490 C546 486 528 466 528 444 C528 428 530 412 532 405 Z"),
  ),
  mask(
    "anterior-coxa-esquerda",
    "coxa",
    "anterior",
    "esquerdo",
    path("M728 458 C703 442 660 455 643 505 C644 545 663 582 689 592 C716 590 742 552 739 502 C738 480 734 464 728 458 Z"),
    path("M728 458 C703 442 660 455 643 505 C644 535 665 562 688 568 C716 570 740 548 739 502 C738 480 734 464 728 458 Z"),
  ),
  mask(
    "anterior-coxa-direita",
    "coxa",
    "anterior",
    "direito",
    path("M535 458 C560 442 603 455 621 505 C620 545 601 582 575 592 C548 590 522 552 525 502 C526 480 529 464 535 458 Z"),
    path("M535 458 C560 442 603 455 621 505 C620 535 599 562 576 568 C548 570 524 548 525 502 C526 480 529 464 535 458 Z"),
  ),
  mask(
    "anterior-joelho-esquerdo",
    "joelho",
    "anterior",
    "esquerdo",
    ellipse(668, 635, 34, 31),
    ellipse(668, 635, 42, 40),
  ),
  mask(
    "anterior-joelho-direito",
    "joelho",
    "anterior",
    "direito",
    ellipse(583, 635, 34, 31),
    ellipse(583, 635, 42, 40),
  ),
  mask(
    "anterior-tibial-anterior-esquerdo",
    "tibial_anterior",
    "anterior",
    "esquerdo",
    path("M694 660 C674 650 649 660 642 704 C642 756 658 797 686 813 C702 779 705 708 694 660 Z"),
    path("M694 660 C674 650 649 660 642 704 C642 756 658 797 686 813 C702 779 705 708 694 660 Z"),
  ),
  mask(
    "anterior-tibial-anterior-direito",
    "tibial_anterior",
    "anterior",
    "direito",
    path("M559 660 C579 650 604 660 611 704 C611 756 595 797 567 813 C551 779 548 708 559 660 Z"),
    path("M559 660 C579 650 604 660 611 704 C611 756 595 797 567 813 C551 779 548 708 559 660 Z"),
  ),
  mask(
    "anterior-tornozelo-pe-esquerdo",
    "tornozelo_pe",
    "anterior",
    "esquerdo",
    path("M651 820 C675 809 720 810 743 833 C750 851 735 875 698 878 C668 881 649 866 646 845 C645 834 646 826 651 820 Z"),
  ),
  mask(
    "anterior-tornozelo-pe-direito",
    "tornozelo_pe",
    "anterior",
    "direito",
    path("M522 820 C546 809 591 810 614 833 C621 851 606 875 569 878 C539 881 520 866 517 845 C516 834 517 826 522 820 Z"),
  ),
];

const FEMININO_MASK_ADJUSTMENTS: Record<string, ShapeAdjust> = {
  "anterior-cabeca": { anteriorDx: -4, dy: -5, rxScale: 0.92 },
  "anterior-pescoco": { anteriorDx: -4, dy: -4 },
  "anterior-ombro-esquerdo": { anteriorDx: -8, dy: -2, rxScale: 0.92 },
  "anterior-ombro-direito": { anteriorDx: 0, dy: -2, rxScale: 0.92 },
  "anterior-braco-esquerdo": { anteriorDx: -8, rxScale: 0.9 },
  "anterior-braco-direito": { anteriorDx: 0, rxScale: 0.9 },
  "anterior-torax": { anteriorDx: -4, dy: 0, rxScale: 0.95 },
  "anterior-abdomen": { anteriorDx: -4, dy: 0, rxScale: 0.92 },
  "anterior-coxofemoral-esquerdo": { anteriorDx: -8, dy: 2, rxScale: 0.95 },
  "anterior-coxofemoral-direito": { anteriorDx: 0, dy: 2, rxScale: 0.95 },
  "anterior-coxa-esquerda": { anteriorDx: -7, dy: 2, rxScale: 0.93 },
  "anterior-coxa-direita": { anteriorDx: -1, dy: 2, rxScale: 0.93 },
  "posterior-cabeca": { posteriorDx: -1, dy: -7, rxScale: 0.92 },
  "posterior-cervical": { posteriorDx: -1, dy: -4 },
  "posterior-ombro-esquerdo": { posteriorDx: -5, dy: -2, rxScale: 0.92 },
  "posterior-ombro-direito": { posteriorDx: 1, dy: -2, rxScale: 0.92 },
  "posterior-braco-esquerdo": { posteriorDx: -6, rxScale: 0.9 },
  "posterior-braco-direito": { posteriorDx: 2, rxScale: 0.9 },
  "posterior-costas": { posteriorDx: -2, dy: -2, rxScale: 0.92 },
  "posterior-coxofemoral-esquerdo": { posteriorDx: -5, dy: 2, rxScale: 0.96 },
  "posterior-coxofemoral-direito": { posteriorDx: -10, dy: 2 },
  "posterior-coxa-esquerda": { posteriorDx: -5, dy: 1, rxScale: 0.94 },
  "posterior-coxa-direita": { posteriorDx: 2, dy: 1, rxScale: 0.94 },
};

const adjustPath = (d: string, dx: number, dy: number) => {
  let coordinateIndex = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (value) => {
    const number = Number(value);
    const adjusted = number + (coordinateIndex % 2 === 0 ? dx : dy);
    coordinateIndex += 1;
    return String(adjusted);
  });
};

const translateShapeX = (shape: BodyMapShape, dx: number): BodyMapShape =>
  adjustShape(shape, dx, 0, 1, 1);

const localizeMask = (bodyMask: BodyMapMask): BodyMapMask => {
  if (bodyMask.vista === "posterior") return bodyMask;

  return {
    ...bodyMask,
    visual: bodyMask.visual.map((shape) =>
      translateShapeX(shape, -BODY_HALF_WIDTH),
    ),
    touch: bodyMask.touch.map((shape) =>
      translateShapeX(shape, -BODY_HALF_WIDTH),
    ),
  };
};

const adjustShape = (
  shape: BodyMapShape,
  dx: number,
  dy: number,
  rxScale: number,
  ryScale: number,
): BodyMapShape => {
  const props = { ...shape.props };

  if (typeof props.cx === "number") props.cx += dx;
  if (typeof props.x === "number") props.x += dx;
  if (typeof props.cy === "number") props.cy += dy;
  if (typeof props.y === "number") props.y += dy;
  if (typeof props.rx === "number") props.rx = Math.round(props.rx * rxScale);
  if (typeof props.ry === "number") props.ry = Math.round(props.ry * ryScale);
  if (typeof props.width === "number") props.width = Math.round(props.width * rxScale);
  if (typeof props.height === "number") props.height = Math.round(props.height * ryScale);
  if (typeof props.d === "string") props.d = adjustPath(props.d, dx, dy);

  return { ...shape, props };
};

const adjustMask = (bodyMask: BodyMapMask): BodyMapMask => {
  const adjust = FEMININO_MASK_ADJUSTMENTS[bodyMask.key] || {};
  const dx = bodyMask.vista === "anterior"
    ? adjust.anteriorDx || 0
    : adjust.posteriorDx || 0;
  const dy = adjust.dy || 0;
  const rxScale = adjust.rxScale || 1;
  const ryScale = adjust.ryScale || 1;

  return {
    ...bodyMask,
    key: `feminino-${bodyMask.key}`,
    visual: bodyMask.visual.map((shape) =>
      adjustShape(shape, dx, dy, rxScale, ryScale),
    ),
    touch: bodyMask.touch.map((shape) =>
      adjustShape(shape, dx, dy, rxScale, ryScale),
    ),
  };
};

export const BODY_REGION_MASKS_BY_VARIANT: Record<BodyVariant, BodyMapMask[]> = {
  masculino: MASCULINO_REGION_MASKS_RAW.map(localizeMask),
  feminino: MASCULINO_REGION_MASKS_RAW.map(adjustMask).map(localizeMask),
};

import { Animation, createAnimation } from '@ionic/core';

type TransitionOptions = {
  enteringEl: HTMLElement;
};

export const noTransition = (
  _: HTMLElement,
  opts: TransitionOptions
): Animation =>
  createAnimation()
    .addElement(opts.enteringEl)
    .duration(0)
    .beforeRemoveClass('ion-page-invisible');

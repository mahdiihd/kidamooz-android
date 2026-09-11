import { TestBed } from '@angular/core/testing';
import { StoryCoverChoiceComponent } from './story-cover-choice.component';

describe('StoryCoverChoiceComponent', () => {
  it('keeps drawing as default and emits a distinct free cover choice', () => {
    const fixture = TestBed.createComponent(StoryCoverChoiceComponent);
    fixture.componentRef.setInput('preview', 'data:image/png;base64,');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const radios = root.querySelectorAll<HTMLInputElement>('input[type=radio]');
    expect(radios.length).toBe(2);
    expect(radios[0].checked).toBeTrue();
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.selectionChange.subscribe(selected);
    radios[1].click();
    expect(selected).toHaveBeenCalledWith('ai_free');
    fixture.componentRef.setInput('coverChoice', 'ai_free');
    fixture.detectChanges();
    expect(root.querySelector('.cover-option--selected input')?.getAttribute('value')).toBe('ai_free');
    expect(root.querySelector('[aria-disabled=true]')).toBeTruthy();
  });

  it('blocks creation while disabled', () => {
    const fixture = TestBed.createComponent(StoryCoverChoiceComponent);
    fixture.componentRef.setInput('preview', 'data:image/png;base64,');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const create = jasmine.createSpy('create');
    fixture.componentInstance.createRequested.subscribe(create);
    fixture.nativeElement.querySelector('.cover-choice__start').click();
    expect(create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
  });
});

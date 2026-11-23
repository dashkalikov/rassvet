'use client';
import {useEffect,useRef,useState} from 'react';
import {Select} from 'radix-ui';
import {Check,ChevronDown,ChevronUp} from 'lucide-react';

type Option={value:string;label:string;disabled?:boolean};
export default function ChoiceSelect({value,onValueChange,options,id,name,disabled=false,required=false,placeholder='Выберите вариант',className='',...aria}:{
  value:string;
  onValueChange:(value:string)=>void;
  options:readonly Option[];
  id?:string;
  name?:string;
  disabled?:boolean;
  required?:boolean;
  placeholder?:string;
  className?:string;
  'aria-label'?:string;
  'aria-describedby'?:string;
  'aria-invalid'?:boolean;
}) {
  const trigger=useRef<HTMLButtonElement>(null);
  const [container,setContainer]=useState<HTMLElement|null>(null);
  // Keep portalled options in the active native dialog's top layer, if any.
  useEffect(()=>{
    const sync=()=>setContainer(trigger.current?.closest('dialog')??(document.fullscreenElement?.contains(trigger.current)?document.fullscreenElement as HTMLElement:document.body));
    sync();document.addEventListener('fullscreenchange',sync);
    return()=>document.removeEventListener('fullscreenchange',sync);
  },[]);
  const selected=options.find(option=>option.value===value);
  return <span className={`choice-select ${className}`}>
    <Select.Root value={value} onValueChange={onValueChange} name={name} disabled={disabled} required={required}>
      <Select.Trigger ref={trigger} className="choice-select-trigger" id={id} aria-haspopup="listbox" {...aria}>
        <Select.Value placeholder={placeholder}>{selected?.label??placeholder}</Select.Value>
        <Select.Icon asChild><ChevronDown size={20} aria-hidden="true"/></Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container??undefined}>
        <Select.Content className="choice-select-menu" position="popper" align="start" sideOffset={7} collisionPadding={16}>
          <Select.ScrollUpButton className="choice-select-scroll"><ChevronUp size={20}/></Select.ScrollUpButton>
          <Select.Viewport className="choice-select-options">
            {options.map(option=><Select.Item key={option.value} value={option.value} disabled={option.disabled} className="choice-select-option"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className="choice-select-check"><Check size={20}/></Select.ItemIndicator></Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="choice-select-scroll"><ChevronDown size={20}/></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </span>;
}

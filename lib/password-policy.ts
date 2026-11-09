export function assessPassword(value:string){
 const rules=[
  {id:'length',label:'От 10 до 128 символов',passed:value.length>=10&&value.length<=128},
  {id:'uppercase',label:'Заглавная латинская буква A–Z',passed:/[A-Z]/.test(value)},
  {id:'lowercase',label:'Строчная латинская буква a–z',passed:/[a-z]/.test(value)},
  {id:'digit',label:'Хотя бы одна цифра 0–9',passed:/[0-9]/.test(value)},
  {id:'special',label:'Спецсимвол, например ! @ # $ % − _',passed:/[^\p{L}\p{N}\s\p{C}]/u.test(value)},
  {id:'no-spaces',label:'Без пробелов и невидимых символов',passed:value.length>0&&!/[\s\p{C}]/u.test(value)},
 ];
 const passed=rules.filter(rule=>rule.passed).length;
 return {valid:passed===rules.length,passed,rules};
}

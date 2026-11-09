'use client';
import {CheckCircle2,Circle,CircleX} from 'lucide-react';
import {assessPassword} from '../lib/password-policy';
export default function PasswordFeedback({password,id}:{password:string;id:string}){
 const assessment=assessPassword(password),started=password.length>0;
 return <div className={`password-feedback ${assessment.valid?'complete':''}`} id={id}><div className="password-feedback-heading"><span>Требования к паролю</span><strong role="status" aria-live="polite">{assessment.valid?'Все требования выполнены':`${assessment.passed} из ${assessment.rules.length}`}</strong></div><div className="password-progress" aria-hidden="true">{assessment.rules.map(rule=><span key={rule.id} className={rule.passed?'met':''}/>)}</div><ul>{assessment.rules.map(rule=>{const Icon=rule.passed?CheckCircle2:started?CircleX:Circle;return <li key={rule.id} className={rule.passed?'met':started?'unmet':'neutral'}><Icon size={15} aria-hidden="true"/><span className="sr-only">{rule.passed?'Выполнено: ':started?'Не выполнено: ':''}</span>{rule.label}</li>;})}</ul></div>;
}

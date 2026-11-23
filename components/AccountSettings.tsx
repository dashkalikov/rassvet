'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowDownToLine,Camera,Check,Eye,EyeOff,ImagePlus,LockKeyhole,LogOut,Mail,Monitor,Palette,Save,ShieldCheck,Trash2,UserRound} from 'lucide-react';
import {api,Modal} from './ui';
import UserAvatar from './UserAvatar';
import PasswordFeedback from './PasswordFeedback';
import ThemePicker from './ThemePicker';
import BackgroundPicker from './BackgroundPicker';
import {assessPassword} from '../lib/password-policy';

export type AccountProfile={name:string;email:string;phone:string;avatar:string;createdAt:string};
type SettingsSection='personal'|'security'|'preferences';
const sections=[{id:'personal',title:'Личные данные',icon:UserRound},{id:'security',title:'Безопасность',icon:ShieldCheck},{id:'preferences',title:'Оформление и данные',icon:Palette}] as const;
const message=(error:unknown)=>error instanceof Error?error.message:'Не удалось сохранить изменения';

async function preparePhoto(file:File,zoom:number) {
  let bitmap:ImageBitmap;
  try{bitmap=await createImageBitmap(file);}catch{throw new Error('Не удалось прочитать изображение. Выберите другое фото.');}
  try {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const context=canvas.getContext('2d');if(!context)throw new Error('Не удалось обработать фото');
    const side=Math.min(bitmap.width,bitmap.height)/zoom;
    context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,512,512);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.84));
    if(!blob||blob.size>256*1024)throw new Error('Попробуйте выбрать фото меньшего размера');
    return blob;
  } finally {bitmap.close();}
}

export default function AccountSettings({profile,onSaved,onSignOut,signingOut=false}:{profile:AccountProfile;onSaved:(profile:AccountProfile)=>void;onSignOut?:()=>void;signingOut?:boolean}) {
  const [section,setSection]=useState<SettingsSection>('personal');
  const [draft,setDraft]=useState({name:profile.name,email:profile.email,phone:profile.phone});
  const [currentPassword,setCurrentPassword]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [photo,setPhoto]=useState<{file:File;url:string}|null>(null),[zoom,setZoom]=useState(1),[photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState('');
  const [password,setPassword]=useState({current:'',next:'',confirm:''}),[showPassword,setShowPassword]=useState(false);
  const fileInput=useRef<HTMLInputElement>(null),lock=useRef(false);
  const emailChanged=draft.email.trim().toLowerCase()!==profile.email;
  const dirty=draft.name!==profile.name||draft.email!==profile.email||draft.phone!==profile.phone;
  const passwordValid=assessPassword(password.next).valid&&password.next===password.confirm&&password.current.length>0;
  useEffect(()=>{if(!photo)return;return()=>URL.revokeObjectURL(photo.url);},[photo]);

  function chooseSection(next:SettingsSection){setSection(next);setError('');setNotice('');}
  function reset(){setDraft({name:profile.name,email:profile.email,phone:profile.phone});setCurrentPassword('');setError('');setNotice('');}
  async function saveContact(event:FormEvent) {
    event.preventDefault();if(lock.current)return;lock.current=true;setSaving(true);setError('');setNotice('');
    try {
      const result=await api<{profile:AccountProfile}>('/api/profile',{method:'PUT',body:JSON.stringify({...draft,...(emailChanged?{currentPassword}:{})})});
      onSaved(result.profile);setDraft({name:result.profile.name,email:result.profile.email,phone:result.profile.phone});setCurrentPassword('');
      setNotice(emailChanged?'Данные сохранены. Для следующего входа используйте новую почту.':'Личные данные сохранены.');
    }catch(error){setError(message(error));}finally{setSaving(false);lock.current=false;}
  }
  function choosePhoto(file?:File) {
    if(!file)return;setError('');setNotice('');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Выберите фото в формате JPEG, PNG или WebP');return;}
    if(file.size>5*1024*1024){setError('Выберите фото размером до 5 МБ');return;}
    setPhotoError('');setZoom(1);setPhoto({file,url:URL.createObjectURL(file)});
  }
  async function savePhoto() {
    if(!photo||lock.current)return;lock.current=true;setPhotoBusy(true);setPhotoError('');
    try {
      const blob=await preparePhoto(photo.file,zoom);
      const result=await api<{profile:AccountProfile}>('/api/profile/avatar',{method:'PUT',headers:{'Content-Type':blob.type},body:blob});
      onSaved(result.profile);setPhoto(null);setNotice('Фото профиля обновлено.');
    }catch(error){setPhotoError(message(error));}finally{setPhotoBusy(false);lock.current=false;}
  }
  async function removePhoto() {
    if(lock.current)return;lock.current=true;setPhotoBusy(true);setError('');setNotice('');
    try{const result=await api<{profile:AccountProfile}>('/api/profile/avatar',{method:'DELETE'});onSaved(result.profile);setNotice('Фото удалено. Вместо него отображается ваша буква.');}
    catch(error){setError(message(error));}finally{setPhotoBusy(false);lock.current=false;}
  }
  async function savePassword(event:FormEvent) {
    event.preventDefault();if(lock.current)return;lock.current=true;setSaving(true);setError('');setNotice('');
    try {
      await api('/api/account/password',{method:'POST',body:JSON.stringify({currentPassword:password.current,newPassword:password.next,confirmPassword:password.confirm})});
      setPassword({current:'',next:'',confirm:''});setNotice('Пароль обновлён. Другие сеансы завершены. Вы остались в аккаунте.');
    }catch(error){setError(message(error));}finally{setSaving(false);lock.current=false;}
  }
  return <div className="account-settings">
    <nav className="settings-navigation" aria-label="Настройки аккаунта">{sections.map(item=><button type="button" key={item.id} aria-pressed={section===item.id} onClick={()=>chooseSection(item.id)}><item.icon size={19}/>{item.title}</button>)}</nav>
    {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-success" role="status"><Check size={18}/>{notice}</p>}
    {section==='personal'&&<div className="settings-personal-grid">
      <section className="account-panel avatar-panel"><span className="eyebrow">ВАШ АККАУНТ</span><UserAvatar name={profile.name} src={profile.avatar} className="profile-avatar"/><h2>{profile.name}</h2><p className="avatar-email">{profile.email}</p><button type="button" className="button outline" onClick={()=>fileInput.current?.click()} disabled={saving||photoBusy}><Camera size={18}/>{profile.avatar?'Изменить фото':'Добавить фото'}</button><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Выбрать фото профиля" onChange={event=>{choosePhoto(event.target.files?.[0]);event.target.value='';}}/>{profile.avatar&&<button type="button" className="text-link remove-avatar" disabled={saving||photoBusy} onClick={()=>void removePhoto()}><Trash2 size={15}/>Удалить фото</button>}<p className="fineprint">JPEG, PNG или WebP до 5 МБ.<br/>Вы сможете выбрать масштаб перед сохранением.</p>{profile.createdAt&&<p className="member-since">С вами с {new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(profile.createdAt))}</p>}</section>
      <form className="account-panel settings-contact-form" onSubmit={saveContact}><div className="settings-panel-heading"><UserRound size={24}/><div><h2>Личные данные</h2><p>Как к вам обращаться и куда подключать связь.</p></div></div><label>Имя<input value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} minLength={2} maxLength={80} required autoComplete="name"/></label><label>Почта<input type="email" value={draft.email} onChange={e=>setDraft(p=>({...p,email:e.target.value}))} required maxLength={254} autoComplete="email"/><small>Ваш логин для входа. Подтверждение письмом не требуется.</small></label><label>Телефон <span className="optional-label">необязательно</span><input type="tel" value={draft.phone} onChange={e=>setDraft(p=>({...p,phone:e.target.value}))} maxLength={30} placeholder="+7 999 123-45-67" autoComplete="tel"/><small>Можно изменить или оставить пустым.</small></label>{emailChanged&&<div className="email-change-confirmation"><Mail size={23}/><p>Вы меняете почту для входа. Подтвердите это текущим паролем.</p><label>Текущий пароль<input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required maxLength={128} autoComplete="current-password"/></label></div>}<div className="settings-form-actions"><button className="button primary" disabled={saving||photoBusy||!dirty}>{saving?'Сохраняем…':'Сохранить изменения'}<Save size={17}/></button><button className="subtle-button" type="button" disabled={saving||!dirty} onClick={reset}>Отменить</button></div><p className="settings-dirty" role="status">{dirty?'Есть несохранённые изменения':'Все изменения сохранены'}</p></form>
    </div>}
    {section==='security'&&<div className="settings-security-grid"><form className="account-panel" onSubmit={savePassword}><div className="settings-panel-heading"><LockKeyhole size={25}/><div><h2>Смена пароля</h2><p>Новый пароль защищает вход во всём приложении.</p></div></div><label>Текущий пароль<input type="password" autoComplete="current-password" value={password.current} onChange={e=>setPassword(p=>({...p,current:e.target.value}))} required maxLength={128}/></label><label>Новый пароль<div className="settings-password-input"><input type={showPassword?'text':'password'} autoComplete="new-password" value={password.next} onChange={e=>setPassword(p=>({...p,next:e.target.value}))} required minLength={10} maxLength={128} aria-describedby="settings-password-rules"/><button type="button" className="icon-button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Скрыть новый пароль':'Показать новый пароль'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><PasswordFeedback password={password.next} id="settings-password-rules"/><label>Повторите новый пароль<input type={showPassword?'text':'password'} autoComplete="new-password" value={password.confirm} onChange={e=>setPassword(p=>({...p,confirm:e.target.value}))} required maxLength={128}/>{password.confirm&&<small role="status">{password.confirm===password.next?'✓ Пароли совпадают':'Пароли пока не совпадают'}</small>}</label><button className="button primary" disabled={saving||!passwordValid}>{saving?'Обновляем…':'Обновить пароль'}<ShieldCheck size={17}/></button></form><aside className="account-panel settings-security-note"><ShieldCheck size={33}/><h2>Вы управляете доступом.</h2><p>Для изменения почты и пароля нужно подтвердить текущий пароль.</p><p>После смены пароля остальные сеансы вашего аккаунта будут завершены. На этом устройстве вход сохранится.</p><p>Пароль хранится в виде защищённого хеша. Заявки, фото и контакты находятся в локальной базе.</p><span className="status-badge"><i/>Вход по почте и паролю</span></aside></div>}
    {section==='preferences'&&<div className="settings-preferences-grid"><ThemePicker/><section className="account-panel settings-data-panel"><ArrowDownToLine size={29}/><h2>Ваши данные — с вами.</h2><p>Скачайте профиль, заявки и обращения одним файлом. Пароль и данные сеансов в выгрузку не входят.</p><a className="button outline" href="/api/account/export" download="rassvet-account.json">Скачать свои данные <ArrowDownToLine size={17}/></a><p className="fineprint"><Monitor size={16}/>Файл JSON можно сохранить как личную копию. Он содержит ваши контактные данные.</p></section><BackgroundPicker/></div>}
    {onSignOut&&<section className="account-panel settings-session-actions"><div><h2>Завершение сеанса</h2><p>Выйти из аккаунта на этом устройстве.</p></div><button type="button" className="logout-button" onClick={onSignOut} disabled={signingOut}><LogOut size={19}/>{signingOut?'Выходим…':'Выйти из аккаунта'}</button></section>}
    {photo&&<Modal title="Фото профиля" close={()=>{if(!photoBusy)setPhoto(null);}}><p className="muted photo-dialog-intro">Выберите масштаб. В аккаунте фото будет круглым.</p><div className="avatar-crop-preview"><img src={photo.url} alt="Предпросмотр фото профиля" style={{transform:`scale(${zoom})`}}/><span aria-hidden="true"/></div><label className="avatar-zoom">Масштаб<span>{Math.round(zoom*100)}%</span><input type="range" min={1} max={3} step={.05} value={zoom} onChange={e=>setZoom(Number(e.target.value))} disabled={photoBusy}/></label>{photoError&&<p role="alert" className="form-error">{photoError}</p>}<div className="modal-actions"><button className="button outline" type="button" disabled={photoBusy} onClick={()=>setPhoto(null)}>Отмена</button><button className="button primary" type="button" disabled={photoBusy} onClick={()=>void savePhoto()}>{photoBusy?'Сохраняем…':'Сохранить фото'}<ImagePlus size={17}/></button></div></Modal>}
  </div>;
}

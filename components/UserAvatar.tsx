export default function UserAvatar({name,src,className=''}:{name:string;src?:string;className?:string}) {
  return <span className={`user-avatar ${className}`} aria-hidden="true">{src?<img src={src} width={96} height={96} alt=""/>:<svg className="avatar-initial" viewBox="0 0 100 100" aria-hidden="true"><text x="50" y="50" dy=".35em" textAnchor="middle" fontSize="40" fill="currentColor" stroke="none">{name.trim().slice(0,1).toUpperCase()||'Р'}</text></svg>}</span>;
}

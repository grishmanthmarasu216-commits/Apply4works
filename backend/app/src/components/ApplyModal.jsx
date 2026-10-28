import { useApp } from '../context/AppContext'

export default function ApplyModal({ job, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
      <div className="w-full max-w-md p-7 rounded-2xl shadow-2xl flex flex-col items-center text-center fade-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
          style={{ background: 'var(--primary-lt)' }}>
          🤔
        </div>

        <h2 className="font-extrabold text-xl mb-1" style={{ color: 'var(--text-h)' }}>
          Did you apply?
        </h2>
        
        <p className="text-sm mb-6" style={{ color: 'var(--text-m)' }}>
          You recently opened the application link for <strong style={{ color: 'var(--text-b)' }}>{job.title}</strong> at <strong style={{ color: 'var(--text-b)' }}>{job.company}</strong>. Were you able to successfully submit your application?
        </p>

          <div className="flex gap-3 mt-2 w-full">
            <button 
              className="flex-1 btn btn-ghost py-2 text-sm text-center justify-center" 
              onClick={() => {
                if(onClose) onClose();
                if(onConfirm) onConfirm(false);
              }}
              style={{ color: 'var(--text-m)' }}
            >
              Not Yet
            </button>
            <button 
              className="flex-1 btn btn-primary py-2 text-sm font-bold text-center justify-center"
              onClick={() => {
                if(onConfirm) onConfirm(true);
              }}
            >
              Yes, Applied
            </button>
          </div>
      </div>
    </div>
  )
}

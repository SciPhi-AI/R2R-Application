import Image from 'next/image';
import Link from 'next/link';

export function Logo({
  link = '/',
  text_size = 'text-3xl',
  logosize = 64,
}: {
  link?: string;
  text_size?: string;
  logosize?: number;
}) {
  return (
    <div className="flex gap-4 items-center justify-center cursor-default select-none relative font-mono font-thin text-blue-400 hover:text-blue-600">
      <Link href={link}>
        <div className="flex items-center justify-center">
          <div>
            <Image
              src="/sciphi.png"
              alt="R2R Logo"
              width={logosize}
              height={logosize}
            />
          </div>
          <div className={`ml-1 ${text_size}`}>R2R</div>
        </div>
      </Link>
    </div>
  );
}

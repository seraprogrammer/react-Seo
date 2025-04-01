import React from 'react';
import Header from '@/components/website/header';
import DocsSidebar from '@/components/website/sidebar';

export default async function ComponentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className='mx-auto pl-2  2xl:container lg:grid 2xl:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-4'>
        <DocsSidebar />
        <div className=' min-w-0 max-w-full'>{children}</div>
      </main>
      <footer className='border-t pb-24 pt-4 xl:pb-4'>
        <div className='container mx-auto'>
          <p className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
            Built by{' '}
            <a
              href='https://x.com/naymur_dev'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              naymur
            </a>{' '}
            . The source code is available on{' '}
            <a
              href='https://github.com/naymurdev/uilayout'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
];

// <html><head>
// <link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
// <link as="style" href="https://fonts.googleapis.com/css2?display=swap&amp;family=Inter%3Awght%40400%3B500%3B700%3B900&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900" onload="this.rel='stylesheet'" rel="stylesheet"/>
// <title>Stitch Design</title>
// <link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
// <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
// <meta charset="utf-8"/>
// <style type="text/tailwindcss">
//       :root {
//         --primary-color: #0c77f2;
//         --secondary-color: #f0f2f5;
//         --text-primary: #111418;
//         --text-secondary: #60748a;
//       }
//       .btn-primary {
//         @apply flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[var(--primary-color)] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors;
//       }
//       .input-field {
//         @apply form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--text-primary)] focus:outline-0 focus:ring-2 focus:ring-[var(--primary-color)] border border-[#dbe0e6] bg-white focus:border-transparent h-14 placeholder:text-[var(--text-secondary)] p-[15px] text-base font-normal leading-normal;
//       }
//     </style>
// </head>
// <body class="bg-white" style='font-family: Inter, "Noto Sans", sans-serif;'>

// </body></html>

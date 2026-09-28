// @vitest-environment jsdom

import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createContainer } from '../composition/container.ts';
import App from './App.tsx';
import { SchedulingStoreProvider } from './SchedulingStoreProvider.tsx';
import { createSchedulingStore } from './store.ts';

afterEach(() => {
  cleanup();
});

it('searches the sample day, selects the first schedule, and confirms it', async () => {
  const user = userEvent.setup();
  renderApp();

  expect(await screen.findByRole('checkbox', { name: /ویزیت پزشک/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'جستجوی برنامه' }));

  expect(await screen.findByRole('radio', { name: 'برنامه ۱، a2, b1, c1' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'برنامه ۲، a3, b3, c2' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'برنامه ۳، a2, b1, c2' })).toBeInTheDocument();
  expect(screen.getByText('10:55')).toBeInTheDocument();
  expect(screen.getByText(/مجموع فاصله ۲۰ دقیقه/)).toBeInTheDocument();

  await user.click(screen.getByRole('radio', { name: 'برنامه ۱، a2, b1, c1' }));
  await user.click(screen.getByRole('button', { name: 'ثبت این برنامه' }));

  expect(await screen.findByRole('heading', { name: 'ثبت شد' })).toBeInTheDocument();
  expect(screen.getByText('bk-1')).toBeInTheDocument();
  expect(screen.getByText('وضعیت: تأییدشده')).toBeInTheDocument();
});

it('shows a retryable fetch error without clearing the presence window', async () => {
  const user = userEvent.setup();
  renderApp();

  expect(await screen.findByRole('checkbox', { name: /ویزیت پزشک/ })).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: 'خطای موقت دریافت' }));
  await user.click(screen.getByRole('button', { name: 'جستجوی برنامه' }));

  expect(await screen.findByText('دریافت نوبت‌ها ناموفق بود.')).toBeInTheDocument();
  expect(screen.getByLabelText('شروع حضور')).toHaveValue('09:00');
  expect(screen.getByLabelText('پایان حضور')).toHaveValue('14:00');

  await user.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
  expect(await screen.findByRole('radio', { name: 'برنامه ۱، a2, b1, c1' })).toBeInTheDocument();
});

it('shows the empty state for a presence window that ends at 10:50', async () => {
  const user = userEvent.setup();
  renderApp();

  expect(await screen.findByLabelText('پایان حضور')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('پایان حضور'));
  await user.type(screen.getByLabelText('پایان حضور'), '10:50');
  await user.click(screen.getByRole('button', { name: 'جستجوی برنامه' }));

  expect(await screen.findByText(/برنامه معتبری با این ترتیب و بازه پیدا نشد/)).toBeInTheDocument();
});

function renderApp() {
  const store = createSchedulingStore(createContainer({ sleep: async () => {} }));
  return render(
    <StrictMode>
      <SchedulingStoreProvider store={store}>
        <App />
      </SchedulingStoreProvider>
    </StrictMode>,
  );
}

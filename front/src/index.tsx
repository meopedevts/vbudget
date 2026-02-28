/* @refresh reload */
import '@/styles/index.css';
import {render} from 'solid-js/web';
import 'solid-devtools';
import {Router} from "@solidjs/router";
import {Toaster} from "@/components/ui/sonner";
import {Layout} from "@/components/layout";
import {Dashboard} from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Integrations from "@/pages/integrations";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";

const app = document.getElementById('app');

if (!app) {
  throw new Error("Application entrypoint not found!");
}

const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      {path: "/", component: Dashboard},
      {path: "/transactions", component: Transactions},
      {path: "/integrations", component: Integrations},
      {path: "/notifications", component: Notifications},
      {path: "/settings", component: Settings},
    ]
  },
]

render(
  () => (
    <>
      <Router base="/app">
        {routes}
      </Router>
      <Toaster/>
    </>
  ), app
);

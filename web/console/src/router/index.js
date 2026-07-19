import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
      {
        path: 'workflows',
        name: 'WorkflowList',
        component: () => import('@/pages/WorkflowList.vue'),
        meta: { title: '剧本管理', icon: 'List' },
      },
      {
        path: 'workflows/:uuid',
        name: 'WorkflowEditor',
        component: () => import('@/pages/WorkflowEditor.vue'),
        meta: { title: '剧本编辑器', icon: 'Edit', hidden: true },
      },
      {
        path: 'apps',
        name: 'AppList',
        component: () => import('@/pages/AppList.vue'),
        meta: { title: 'APP 管理', icon: 'Grid' },
      },
      {
        path: 'logs',
        name: 'LogList',
        component: () => import('@/pages/LogList.vue'),
        meta: { title: '执行日志', icon: 'Document' },
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/pages/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: () => import('@/pages/RoleList.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' },
      },
      {
        path: 'variables',
        name: 'VariableList',
        component: () => import('@/pages/VariableList.vue'),
        meta: { title: '全局变量', icon: 'Coin' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 — 未登录跳转登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('soar_token')
  if (to.meta.public) {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router
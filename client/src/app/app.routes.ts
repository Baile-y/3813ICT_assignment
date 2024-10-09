import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GroupComponent } from './group/group.component';
import { ChannelComponent } from './channel/channel.component';
import { ChatComponent } from './chat/chat.component';
import { AuthGuard } from './guards/auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { GroupAdminGuard } from './guards/group-admin.guard';
import { InvitesComponent } from './invite/invite.component';
import { AdminComponent } from './admin/admin.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { VideoChatComponent } from './video-chat/video-chat.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'group', component: GroupComponent, canActivate: [AuthGuard] },
  { path: 'channel', component: ChannelComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'invites', component: InvitesComponent, canActivate: [AuthGuard]},
  { path: 'admin', component: AdminComponent, canActivate: [SuperAdminGuard]},
  { path: 'video-chat', component: VideoChatComponent, canActivate: [AuthGuard]},
  { path: 'register', component: RegisterComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

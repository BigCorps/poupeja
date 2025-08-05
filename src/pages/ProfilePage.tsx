import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Camera, Mail, Key, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProfilePage = () => {
  const { t } = usePreferences();
  const { user, updateUserProfile } = useAppContext();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Estado local para exibir os dados atualizados imediatamente
  const [currentUserData, setCurrentUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || ''
  });
  
  // For password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Verificar se é admin vindo da página admin
  const isAdminFromAdminPage = isAdmin && document.referrer.includes('/admin');

  
  // Fetch the latest user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('poupeja_users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data && !error) {
            const userData = {
              name: data.name || '',
              email: session.user.email || '',
              phone: data.phone || '',
              profileImage: data.profile_image || ''
            };
            
            setName(userData.name);
            setEmail(userData.email);
            setPhone(userData.phone);
            setProfileImage(userData.profileImage);
            setCurrentUserData(userData);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    try {
      console.log('ProfilePage: Updating profile...');
      
      // Format phone number to ensure it only contains digits
      const formattedPhone = phone.replace(/\D/g, '');
      
      // Check if email changed
      const emailChanged = email !== user?.email;
      
      // Update profile data using context method
      console.log('ProfilePage: Updating profile data:', { name, phone: formattedPhone, profileImage });
      await updateUserProfile({ 
        name,
        phone: formattedPhone,
        profileImage
      });
      
      // Update email if changed
      if (emailChanged) {
        console.log('ProfilePage: Updating user email');
        
        const { error: updateEmailError } = await supabase.functions.invoke('update-user-email', {
          body: { email }
        });
        
        if (updateEmailError) {
          console.error('ProfilePage: Error updating email:', updateEmailError);
          toast({
            title: t('common.error'),
            description: 'Erro ao atualizar email',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Atualizar estado local imediatamente para refletir as mudanças na UI
      const updatedUserData = {
        name,
        email,
        phone: formattedPhone,
        profileImage
      };
      setCurrentUserData(updatedUserData);
      
      // Show success message
      toast({
        title: t('common.success'),
        description: 'Perfil atualizado com sucesso',
      });
      
      setIsEditing(false);
      console.log('ProfilePage: Profile update completed successfully');
      
    } catch (error) {
      console.error("ProfilePage: Error updating profile:", error);
      toast({
        title: t('common.error'),
        description: 'Erro ao atualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }
    
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: 'Senha alterada com sucesso',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao alterar senha',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se o arquivo é uma imagem válida
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: 'Por favor, selecione apenas arquivos de imagem',
        variant: 'destructive',
      });
      return;
    }

    // Verificar o tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Primeiro, verificar se o bucket existe ou tentar criar
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (!avatarBucket) {
        // Tentar criar o bucket se não existir
        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          // Se não conseguir criar o bucket, usar um método alternativo
          // Vamos tentar usar o bucket padrão do Supabase
        }
      }

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user?.id || 'user'}_${Date.now()}.${fileExt}`;
      
      // Tentar upload no bucket avatars primeiro
      let uploadResult = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      // Se falhar, tentar bucket alternativo ou criar na pasta do usuário
      if (uploadResult.error) {
        console.log('Trying alternative upload method...');
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });
      }

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadResult.data.path);

      const newProfileImage = urlData.publicUrl;
      setProfileImage(newProfileImage);
      
      // Atualizar estado local para mostrar a nova imagem imediatamente
      setCurrentUserData(prev => ({
        ...prev,
        profileImage: newProfileImage
      }));

      toast({
        title: t('common.success'),
        description: 'Imagem carregada com sucesso! Lembre-se de salvar o perfil.',
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao fazer upload da imagem. Verifique se o arquivo é uma imagem válida.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  if (isAdminFromAdminPage) {
    return (
      <MainLayout title="Perfil do Administrador">
        <div className="space-y-6 pb-16">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perfil do Administrador</h1>
            <p className="text-muted-foreground">Gerencie suas informações de acesso</p>
          </div>
          
          <Separator />
          
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Seus dados de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    {uploading ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={profileImage} />
                        <AvatarFallback className="text-lg">{name?.charAt(0) || email?.charAt(0)}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{user?.name || 'Administrador'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="font-medium">Nome</label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Seu nome completo" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="email" className="font-medium">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          id="email" 
                          type="email"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          placeholder="seu@email.com" 
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={updatingProfile}>
                        {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.save')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editar Informações</Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <label htmlFor="newPassword" className="font-medium">Nova Senha</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="font-medium">Confirmar Senha</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={t('profile.title')}>
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">Gerencie seus dados pessoais</p>
        </div>
        
        <Separator />
        
        <div className="grid gap-6">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="password">Senha</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Seus dados de cadastro e contato</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        {uploading ? (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={currentUserData.profileImage} />
                            <AvatarFallback className="text-xl">
                              {currentUserData.name?.charAt(0) || currentUserData.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {isEditing && (
                        <div 
                          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                          onClick={handleImageClick}
                        >
                          <Camera className="h-4 w-4" />
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageChange}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {currentUserData.name || 'Usuário'}
                      </h3>
                      <p className="text-muted-foreground">{currentUserData.email}</p>
                      {currentUserData.phone && (
                        <p className="text-muted-foreground">{currentUserData.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-2">
                        <label htmlFor="name" className="font-medium">Nome</label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Seu nome completo" 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="email" className="font-medium">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            id="email" 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="seu@email.com" 
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="phone" className="font-medium">WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            id="phone" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            placeholder="5511999999999" 
                            className="pl-10"
                            type="tel"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Formato: código do país + DDD + número (ex: 5511999999999)
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={updatingProfile}>
                          {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('common.save')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Atualize sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="newPassword" className="font-medium">Nova Senha</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          id="newPassword" 
                          type="password"
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="confirmPassword" className="font-medium">Confirmar Senha</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;

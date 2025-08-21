'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Clock, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackgroundCurves from '@/components/landing/BackgroundCurves';

export default function TeamRequestSubmittedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const company = searchParams.get('company');
    if (company) {
      setCompanyName(decodeURIComponent(company));
    }
  }, [searchParams]);

  return (
    <>
      {/* Background curves identique au landing */}
      <BackgroundCurves />
      
      <div className="min-h-screen flex items-center justify-center bg-black p-4 relative">
        <div className="relative w-full max-w-lg">
          <Card className="p-8 text-center shadow-2xl border border-gray-700 bg-gray-900/90 backdrop-blur-md">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Demande envoyée avec succès !
            </h1>
            
            {companyName && (
              <p className="text-lg text-gray-300 mb-6">
                Votre demande pour rejoindre l'équipe de <span className="font-semibold text-gradient">{companyName}</span> a été transmise.
              </p>
            )}
          
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                <Clock className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white mb-1">Examen en cours</h3>
                  <p className="text-sm text-gray-300">
                    Un administrateur va examiner votre demande. Cela peut prendre quelques jours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white mb-1">Notification par email</h3>
                  <p className="text-sm text-gray-300">
                    Si votre demande est approuvée, vous recevrez un email d'invitation avec un lien pour créer votre compte.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white mb-1">Accès complet</h3>
                  <p className="text-sm text-gray-300">
                    Une fois votre compte créé, vous aurez accès aux projets de l'équipe avec les privilèges RH.
                  </p>
                </div>
              </div>
            </div>
          
            <div className="space-y-3">
              <Button 
                onClick={() => router.back()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Retourner au projet
              </Button>
              
              <p className="text-xs text-gray-400">
                Vérifiez vos emails (y compris les spams) dans les prochains jours.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
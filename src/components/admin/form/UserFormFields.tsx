
import React from 'react';
import UserNameField from './fields/UserNameField';
import UserFirstNameField from './fields/UserFirstNameField';
import UserEmailField from './fields/UserEmailField';
import UserPasswordField from './fields/UserPasswordField';

interface UserFormFieldsProps {
  fieldErrors: {[key: string]: string};
  values: {
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserFormFields = ({ fieldErrors, values, onChange }: UserFormFieldsProps) => {
  return (
    <>
      <UserNameField
        value={values.nom}
        error={fieldErrors.nom}
        onChange={onChange}
      />
      <UserFirstNameField
        value={values.prenom}
        error={fieldErrors.prenom}
        onChange={onChange}
      />
      <UserEmailField
        value={values.email}
        error={fieldErrors.email}
        onChange={onChange}
      />
      <UserPasswordField
        value={values.mot_de_passe}
        error={fieldErrors.mot_de_passe}
        onChange={onChange}
      />
    </>
  );
};

export default UserFormFields;

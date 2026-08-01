var module = angular.module('keycloak.loaders', [
  'keycloak.services',
  'ngResource',
]);

module.factory('Loader', ($q) => {
  var loader = {};
  loader.get = (service, id) => () => {
    var i = id?.();
    var delay = $q.defer();
    service.get(
      i,
      (entry) => {
        delay.resolve(entry);
      },
      () => {
        delay.reject(`Unable to fetch ${i}`);
      },
    );
    return delay.promise;
  };
  loader.query = (service, id) => () => {
    var i = id?.();
    var delay = $q.defer();
    service.query(
      i,
      (entry) => {
        delay.resolve(entry);
      },
      () => {
        delay.reject(`Unable to fetch ${i}`);
      },
    );
    return delay.promise;
  };
  return loader;
});

module.factory('RealmListLoader', (Loader, Realm, _$q) => Loader.get(Realm));

module.factory(
  'ServerInfoLoader',
  (_Loader, ServerInfo) => () => ServerInfo.promise,
);

module.factory('RealmLoader', (Loader, Realm, $route, _$q) =>
  Loader.get(Realm, () => ({
    id: $route.current.params.realm,
  })),
);

module.factory('RealmKeysLoader', (Loader, RealmKeys, $route, _$q) =>
  Loader.get(RealmKeys, () => ({
    id: $route.current.params.realm,
  })),
);

module.factory(
  'RealmSpecificLocalesLoader',
  (Loader, RealmSpecificLocales, $route, _$q) =>
    Loader.get(RealmSpecificLocales, () => ({
      id: $route.current.params.realm,
    })),
);

module.factory(
  'RealmSpecificlocalizationTextLoader',
  (Loader, RealmSpecificLocalizationText, $route, _$q) =>
    Loader.get(RealmSpecificLocalizationText, () => ({
      realm: $route.current.params.realm,
      locale: $route.current.params.locale,
      key: $route.current.params.key,
    })),
);

module.factory(
  'RealmEventsConfigLoader',
  (Loader, RealmEventsConfig, $route, _$q) =>
    Loader.get(RealmEventsConfig, () => ({
      id: $route.current.params.realm,
    })),
);

module.factory('UserListLoader', (Loader, User, $route, _$q) =>
  Loader.query(User, () => ({
    realm: $route.current.params.realm,
  })),
);

module.factory(
  'RequiredActionsListLoader',
  (Loader, RequiredActions, $route, _$q) =>
    Loader.query(RequiredActions, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'UnregisteredRequiredActionsListLoader',
  (Loader, UnregisteredRequiredActions, $route, _$q) =>
    Loader.query(UnregisteredRequiredActions, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'RealmSessionStatsLoader',
  (Loader, RealmSessionStats, $route, _$q) =>
    Loader.get(RealmSessionStats, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'RealmClientSessionStatsLoader',
  (Loader, RealmClientSessionStats, $route, _$q) =>
    Loader.query(RealmClientSessionStats, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'ClientProtocolMapperLoader',
  (Loader, ClientProtocolMapper, $route, _$q) =>
    Loader.get(ClientProtocolMapper, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
      id: $route.current.params.id,
    })),
);

module.factory(
  'ClientScopeProtocolMapperLoader',
  (Loader, ClientScopeProtocolMapper, $route, _$q) =>
    Loader.get(ClientScopeProtocolMapper, () => ({
      realm: $route.current.params.realm,
      clientScope: $route.current.params.clientScope,
      id: $route.current.params.id,
    })),
);

module.factory('UserLoader', (Loader, User, $route, _$q) =>
  Loader.get(User, () => ({
    realm: $route.current.params.realm,
    userId: $route.current.params.user,
  })),
);

module.factory('ComponentLoader', (Loader, Components, $route, _$q) =>
  Loader.get(Components, () => ({
    realm: $route.current.params.realm,
    componentId: $route.current.params.componentId,
  })),
);

module.factory('LDAPMapperLoader', (Loader, Components, $route, _$q) =>
  Loader.get(Components, () => ({
    realm: $route.current.params.realm,
    componentId: $route.current.params.mapperId,
  })),
);

module.factory('ComponentsLoader', (Loader, Components, $route, _$q) => {
  var componentsLoader = {};

  componentsLoader.loadComponents = (parent, componentType) =>
    Loader.query(Components, () => ({
      realm: $route.current.params.realm,
      parent: parent,
      type: componentType,
    }))();

  return componentsLoader;
});

module.factory(
  'SubComponentTypesLoader',
  (Loader, SubComponentTypes, $route, _$q) => {
    var componentsLoader = {};

    componentsLoader.loadComponents = (parent, componentType) =>
      Loader.query(SubComponentTypes, () => ({
        realm: $route.current.params.realm,
        componentId: parent,
        type: componentType,
      }))();

    return componentsLoader;
  },
);

module.factory(
  'UserSessionStatsLoader',
  (Loader, UserSessionStats, $route, _$q) =>
    Loader.get(UserSessionStats, () => ({
      realm: $route.current.params.realm,
      user: $route.current.params.user,
    })),
);

module.factory('UserSessionsLoader', (Loader, UserSessions, $route, _$q) =>
  Loader.query(UserSessions, () => ({
    realm: $route.current.params.realm,
    user: $route.current.params.user,
  })),
);

module.factory(
  'UserOfflineSessionsLoader',
  (Loader, UserOfflineSessions, $route, _$q) =>
    Loader.query(UserOfflineSessions, () => ({
      realm: $route.current.params.realm,
      user: $route.current.params.user,
      client: $route.current.params.client,
    })),
);

module.factory(
  'UserFederatedIdentityLoader',
  (Loader, UserFederatedIdentities, $route, _$q) =>
    Loader.query(UserFederatedIdentities, () => ({
      realm: $route.current.params.realm,
      user: $route.current.params.user,
    })),
);

module.factory('UserConsentsLoader', (Loader, UserConsents, $route, _$q) =>
  Loader.query(UserConsents, () => ({
    realm: $route.current.params.realm,
    user: $route.current.params.user,
  })),
);

module.factory('RoleLoader', (Loader, RoleById, $route, _$q) =>
  Loader.get(RoleById, () => ({
    realm: $route.current.params.realm,
    role: $route.current.params.role,
  })),
);

module.factory('RoleListLoader', (Loader, Role, $route, _$q) =>
  Loader.query(Role, () => ({
    realm: $route.current.params.realm,
  })),
);

module.factory('ClientRoleLoader', (Loader, RoleById, $route, _$q) =>
  Loader.get(RoleById, () => ({
    realm: $route.current.params.realm,
    client: $route.current.params.client,
    role: $route.current.params.role,
  })),
);

module.factory(
  'ClientSessionStatsLoader',
  (Loader, ClientSessionStats, $route, _$q) =>
    Loader.get(ClientSessionStats, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory(
  'ClientSessionCountLoader',
  (Loader, ClientSessionCount, $route, _$q) =>
    Loader.get(ClientSessionCount, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory(
  'ClientOfflineSessionCountLoader',
  (Loader, ClientOfflineSessionCount, $route, _$q) =>
    Loader.get(ClientOfflineSessionCount, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory(
  'ClientDefaultClientScopesLoader',
  (Loader, ClientDefaultClientScopes, $route, _$q) =>
    Loader.query(ClientDefaultClientScopes, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory(
  'ClientOptionalClientScopesLoader',
  (Loader, ClientOptionalClientScopes, $route, _$q) =>
    Loader.query(ClientOptionalClientScopes, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory('ClientLoader', (Loader, Client, $route, _$q) =>
  Loader.get(Client, () => ({
    realm: $route.current.params.realm,
    client: $route.current.params.client,
  })),
);

module.factory('ClientListLoader', (Loader, Client, $route, _$q) =>
  Loader.query(Client, () => ({
    realm: $route.current.params.realm,
    first: 0,
    max: 20,
  })),
);

module.factory('ClientScopeLoader', (Loader, ClientScope, $route, _$q) =>
  Loader.get(ClientScope, () => ({
    realm: $route.current.params.realm,
    clientScope: $route.current.params.clientScope,
  })),
);

module.factory('ClientScopeListLoader', (Loader, ClientScope, $route, _$q) =>
  Loader.query(ClientScope, () => ({
    realm: $route.current.params.realm,
  })),
);

module.factory(
  'RealmDefaultClientScopesLoader',
  (Loader, RealmDefaultClientScopes, $route, _$q) =>
    Loader.query(RealmDefaultClientScopes, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'RealmOptionalClientScopesLoader',
  (Loader, RealmOptionalClientScopes, $route, _$q) =>
    Loader.query(RealmOptionalClientScopes, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'ClientServiceAccountUserLoader',
  (Loader, ClientServiceAccountUser, $route, _$q) =>
    Loader.get(ClientServiceAccountUser, () => ({
      realm: $route.current.params.realm,
      client: $route.current.params.client,
    })),
);

module.factory('RoleMappingLoader', (Loader, RoleMapping, $route, _$q) => {
  var realm = $route.current.params.realm || $route.current.params.client;

  return Loader.query(RoleMapping, () => ({
    realm: realm,
    role: $route.current.params.role,
  }));
});

module.factory(
  'IdentityProviderLoader',
  (Loader, IdentityProvider, $route, _$q) =>
    Loader.get(IdentityProvider, () => ({
      realm: $route.current.params.realm,
      alias: $route.current.params.alias,
    })),
);

module.factory(
  'IdentityProviderFactoryLoader',
  (Loader, IdentityProviderFactory, $route, _$q) =>
    Loader.get(IdentityProviderFactory, () => ({
      realm: $route.current.params.realm,
      provider_id: $route.current.params.provider_id,
    })),
);

module.factory(
  'IdentityProviderMapperTypesLoader',
  (Loader, IdentityProviderMapperTypes, $route, _$q) =>
    Loader.get(IdentityProviderMapperTypes, () => ({
      realm: $route.current.params.realm,
      alias: $route.current.params.alias,
    })),
);

module.factory(
  'IdentityProviderMappersLoader',
  (Loader, IdentityProviderMappers, $route, _$q) =>
    Loader.query(IdentityProviderMappers, () => ({
      realm: $route.current.params.realm,
      alias: $route.current.params.alias,
    })),
);

module.factory(
  'IdentityProviderMapperLoader',
  (Loader, IdentityProviderMapper, $route, _$q) =>
    Loader.get(IdentityProviderMapper, () => ({
      realm: $route.current.params.realm,
      alias: $route.current.params.alias,
      mapperId: $route.current.params.mapperId,
    })),
);

module.factory(
  'AuthenticationFlowsLoader',
  (Loader, AuthenticationFlows, $route, _$q) =>
    Loader.query(AuthenticationFlows, () => ({
      realm: $route.current.params.realm,
      flow: '',
    })),
);

module.factory(
  'AuthenticationFormProvidersLoader',
  (Loader, AuthenticationFormProviders, $route, _$q) =>
    Loader.query(AuthenticationFormProviders, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'AuthenticationFormActionProvidersLoader',
  (Loader, AuthenticationFormActionProviders, $route, _$q) =>
    Loader.query(AuthenticationFormActionProviders, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'AuthenticatorProvidersLoader',
  (Loader, AuthenticatorProviders, $route, _$q) =>
    Loader.query(AuthenticatorProviders, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'ClientAuthenticatorProvidersLoader',
  (Loader, ClientAuthenticatorProviders, $route, _$q) =>
    Loader.query(ClientAuthenticatorProviders, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'AuthenticationFlowLoader',
  (Loader, AuthenticationFlows, $route, _$q) =>
    Loader.get(AuthenticationFlows, () => ({
      realm: $route.current.params.realm,
      flow: $route.current.params.flow,
    })),
);

module.factory(
  'AuthenticationConfigDescriptionLoader',
  (Loader, AuthenticationConfigDescription, $route, _$q) =>
    Loader.get(AuthenticationConfigDescription, () => ({
      realm: $route.current.params.realm,
      provider: $route.current.params.provider,
    })),
);

module.factory(
  'PerClientAuthenticationConfigDescriptionLoader',
  (Loader, PerClientAuthenticationConfigDescription, $route, _$q) =>
    Loader.get(PerClientAuthenticationConfigDescription, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'ExecutionIdLoader',
  ($route) => () => $route.current.params.executionId,
);

module.factory(
  'AuthenticationConfigLoader',
  (Loader, AuthenticationConfig, $route, _$q) =>
    Loader.get(AuthenticationConfig, () => ({
      realm: $route.current.params.realm,
      config: $route.current.params.config,
    })),
);

module.factory('GroupListLoader', (Loader, Groups, $route, _$q) =>
  Loader.query(Groups, () => ({
    realm: $route.current.params.realm,
  })),
);

module.factory('GroupCountLoader', (Loader, GroupsCount, $route, _$q) =>
  Loader.query(GroupsCount, () => ({
    realm: $route.current.params.realm,
    top: true,
  })),
);

module.factory('GroupLoader', (Loader, Group, $route, _$q) =>
  Loader.get(Group, () => ({
    realm: $route.current.params.realm,
    groupId: $route.current.params.group,
  })),
);

module.factory(
  'ClientInitialAccessLoader',
  (Loader, ClientInitialAccess, $route) =>
    Loader.query(ClientInitialAccess, () => ({
      realm: $route.current.params.realm,
    })),
);

module.factory(
  'ClientRegistrationPolicyProvidersLoader',
  (Loader, ClientRegistrationPolicyProviders, $route) =>
    Loader.query(ClientRegistrationPolicyProviders, () => ({
      realm: $route.current.params.realm,
    })),
);

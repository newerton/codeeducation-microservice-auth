var module = angular.module('keycloak.services', ['ngResource', 'ngRoute']);

module.service('Dialog', ($modal, $translate) => {
  var dialog = {};

  var openDialog = (title, message, btns, template) => {
    var controller = ($scope, $modalInstance, title, message, btns) => {
      $scope.title = title;
      $scope.message = message;
      $scope.btns = btns;

      $scope.ok = () => {
        $modalInstance.close();
      };
      $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
      };
    };

    return $modal.open({
      templateUrl: resourceUrl + template,
      controller: controller,
      resolve: {
        title: () => title,
        message: () => message,
        btns: () => btns,
      },
    }).result;
  };

  var escapeHtml = (str) => {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  dialog.confirmDelete = (name, type, success) => {
    var title = $translate.instant('dialogs.delete.title', {
      type: escapeHtml(type.charAt(0).toUpperCase() + type.slice(1)),
    });
    var msg = $translate.instant('dialogs.delete.message', {
      type: type,
      name: name,
    });
    var confirm = $translate.instant('dialogs.delete.confirm');

    dialog.confirmWithButtonText(title, msg, confirm, success);
  };

  dialog.confirmGenerateKeys = (name, _type, success) => {
    var title = 'Generate new keys for realm';
    var msg = `Are you sure you want to permanently generate new keys for ${name}?`;
    var btns = {
      ok: {
        label: 'Generate Keys',
        cssClass: 'btn btn-danger',
      },
      cancel: {
        label: 'Cancel',
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, msg, btns, '/templates/kc-modal.html').then(success);
  };

  dialog.confirm = (title, message, success, cancel) => {
    dialog.confirmWithButtonText(title, message, title, success, cancel);
  };

  dialog.confirmWithButtonText = (title, message, confirm, success, cancel) => {
    var btns = {
      ok: {
        label: confirm,
        cssClass: 'btn btn-danger',
      },
      cancel: {
        label: $translate.instant('dialogs.cancel'),
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, message, btns, '/templates/kc-modal.html').then(
      success,
      cancel,
    );
  };

  dialog.message = (title, message, success, cancel) => {
    var btns = {
      ok: {
        label: $translate.instant('dialogs.ok'),
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, message, btns, '/templates/kc-modal-message.html').then(
      success,
      cancel,
    );
  };

  dialog.open = (title, message, btns, success, cancel) => {
    openDialog(title, message, btns, '/templates/kc-modal.html').then(
      success,
      cancel,
    );
  };

  return dialog;
});

module.service('CopyDialog', ($modal) => {
  var dialog = {};
  dialog.open = (title, suggested, success) => {
    var controller = ($scope, $modalInstance, title) => {
      $scope.title = title;
      $scope.name = { value: `Copy of ${suggested}` };
      $scope.ok = () => {
        console.log(`ok with name: ${$scope.name}`);
        $modalInstance.close();
        success($scope.name.value);
      };
      $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
      };
    };
    $modal.open({
      templateUrl: `${resourceUrl}/templates/kc-copy.html`,
      controller: controller,
      resolve: {
        title: () => title,
      },
    });
  };
  return dialog;
});

module.service('UpdateDialog', ($modal) => {
  var dialog = {};
  dialog.open = (title, name, desc, success) => {
    var controller = ($scope, $modalInstance, title) => {
      $scope.title = title;
      $scope.name = { value: name };
      $scope.description = { value: desc };
      $scope.ok = () => {
        console.log(
          `ok with name: ${$scope.name}and description: ${$scope.description}`,
        );
        $modalInstance.close();
        success($scope.name.value, $scope.description.value);
      };
      $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
      };
    };
    $modal.open({
      templateUrl: `${resourceUrl}/templates/kc-edit.html`,
      controller: controller,
      resolve: {
        title: () => title,
      },
    });
  };
  return dialog;
});

module.factory('Notifications', ($rootScope, $timeout, $translate) => {
  // time (in ms) the notifications are shown
  var delay = 5000;

  var notifications = {};
  notifications.current = { display: false };
  notifications.current.remove = () => {
    if (notifications.scheduled) {
      $timeout.cancel(notifications.scheduled);
      delete notifications.scheduled;
    }
    delete notifications.current.type;
    delete notifications.current.header;
    delete notifications.current.message;
    notifications.current.display = false;
    console.debug('Remove message');
  };

  $rootScope.notification = notifications.current;

  notifications.message = (type, header, message) => {
    notifications.current.remove();

    notifications.current.type = type;
    notifications.current.header = header;
    notifications.current.message = message;
    notifications.current.display = true;

    notifications.scheduled = $timeout(() => {
      notifications.current.remove();
    }, delay);

    console.debug('Added message');
  };

  notifications.info = (message) => {
    notifications.message(
      'info',
      $translate.instant('notifications.info.header'),
      message,
    );
  };

  notifications.success = (message) => {
    notifications.message(
      'success',
      $translate.instant('notifications.success.header'),
      message,
    );
  };

  notifications.error = (message) => {
    notifications.message(
      'danger',
      $translate.instant('notifications.error.header'),
      message,
    );
  };

  notifications.warn = (message) => {
    notifications.message(
      'warning',
      $translate.instant('notifications.warn.header'),
      message,
    );
  };

  return notifications;
});

module.factory('ComponentUtils', () => {
  function sortGroups(prop, arr) {
    // sort current elements
    arr.sort((a, b) => {
      if (a[prop] < b[prop]) {
        return -1;
      }
      if (a[prop] > b[prop]) {
        return 1;
      }
      return 0;
    });
    // check sub groups
    arr.forEach((item, _index) => {
      if (item.subGroups) {
        sortGroups(prop, item.subGroups);
      }
    });
    return arr;
  }

  var utils = {};

  utils.sortGroups = sortGroups;

  utils.findIndexById = (array, id) => {
    for (var i = 0; i < array.length; i++) {
      if (array[i].id === id) return i;
    }
    return -1;
  };

  utils.convertAllMultivaluedStringValuesToList = (properties, config) => {
    if (!properties) {
      return;
    }

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      if (prop.type === 'MultivaluedString') {
        var configProperty = config[prop.name];

        if (configProperty == null) {
          configProperty = [];
          config[prop.name] = configProperty;
        }

        if (typeof configProperty === 'string') {
          configProperty = configProperty.split('##');
          config[prop.name] = configProperty;
        }
      }
    }
  };

  utils.convertAllListValuesToMultivaluedString = (properties, config) => {
    if (!properties) {
      return;
    }

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      if (prop.type === 'MultivaluedString') {
        var configVal = config[prop.name];

        if (configVal != null) {
          if (configVal.length > 0) {
            var lastVal = configVal[configVal.length - 1];
            if (lastVal === '') {
              console.log(
                `Remove empty value from config property: ${prop.name}`,
              );
              configVal.splice(configVal.length - 1, 1);
            }
          }

          var attrVals = configVal.join('##');
          config[prop.name] = attrVals;
        }
      }
    }
  };

  utils.addLastEmptyValueToMultivaluedLists = (properties, config) => {
    if (!properties) {
      return;
    }

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      if (prop.type === 'MultivaluedString') {
        var configProperty = config[prop.name];

        if (configProperty == null) {
          configProperty = [];
          config[prop.name] = configProperty;
        }

        if (
          configProperty.length === 0 ||
          configProperty[configProperty.length - 1].length > 0
        ) {
          configProperty.push('');
        }
      }
    }
  };

  utils.removeLastEmptyValue = (componentConfig) => {
    for (var configPropertyName in componentConfig) {
      var configVal = componentConfig[configPropertyName];
      if (configVal && configVal.length > 0) {
        var lastVal = configVal[configVal.length - 1];
        if (lastVal === '') {
          console.log(
            `Remove empty value from config property: ${configPropertyName}`,
          );
          configVal.splice(configVal.length - 1, 1);
        }
      }
    }
  };

  // Allows you to use ui-select2 with <input> tag.
  // In HTML you will then use property.mvOptions like this:
  // <input ui-select2="prop.mvOptions" ng-model="...
  utils.addMvOptionsToMultivaluedLists = (properties) => {
    if (!properties) return;

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      if (prop.type !== 'MultivaluedList') continue;

      prop.mvOptions = {
        multiple: true,
        simple_tags: true,
        tags: angular.copy(prop.options),
      };
    }
  };

  return utils;
});

module.factory('Realm', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:id`,
    {
      id: '@realm',
    },
    {
      update: {
        method: 'PUT',
      },
      create: {
        method: 'POST',
        params: { id: '' },
      },
    },
  ),
);

module.factory('RealmKeys', ($resource) =>
  $resource(`${authUrl}/admin/realms/:id/keys`, {
    id: '@realm',
  }),
);

module.factory('RealmSpecificLocales', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:id/localization`,
    {
      id: '@realm',
    },
    { get: { method: 'GET', isArray: true } },
  ),
);

module.factory('RealmSpecificLocalizationTexts', ($resource) =>
  $resource(`${authUrl}/admin/realms/:id/localization/:locale`, {
    id: '@realm',
    locale: '@locale',
  }),
);

module.factory('RealmSpecificLocalizationText', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/localization/:locale/:key`,
    {
      realm: '@realm',
      locale: '@locale',
      key: '@key',
    },
    {
      // wrap plain text response as AngularJS $resource will convert it into a char array otherwise.
      get: {
        method: 'GET',
        transformResponse: (data) => ({ content: data }),
      },
      save: {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      },
    },
  ),
);

module.factory('RealmEventsConfig', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:id/events/config`,
    {
      id: '@realm',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RealmEvents', ($resource) =>
  $resource(`${authUrl}/admin/realms/:id/events`, {
    id: '@realm',
  }),
);

module.factory('RealmAdminEvents', ($resource) =>
  $resource(`${authUrl}/admin/realms/:id/admin-events`, {
    id: '@realm',
  }),
);

module.factory('BruteForce', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/attack-detection/brute-force/users`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('BruteForceUser', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/attack-detection/brute-force/users/:userId`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ),
);

module.factory('RequiredActions', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/required-actions/:alias`,
    {
      realm: '@realm',
      alias: '@alias',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RequiredActionRaisePriority', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/required-actions/:alias/raise-priority`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('RequiredActionLowerPriority', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/required-actions/:alias/lower-priority`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('UnregisteredRequiredActions', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/unregistered-required-actions`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('RegisterRequiredAction', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/register-required-action`,
    {
      realm: '@realm',
    },
  ),
);

module.factory(
  'RealmLDAPConnectionTester',
  ($resource, _$httpParamSerializer) =>
    $resource(`${authUrl}/admin/realms/:realm/testLDAPConnection`, {
      realm: '@realm',
    }),
);

module.factory(
  'RealmSMTPConnectionTester',
  ($resource, _$httpParamSerializer) =>
    $resource(`${authUrl}/admin/realms/:realm/testSMTPConnection`, {
      realm: '@realm',
    }),
);

module.service('ServerInfo', (_$resource, $q, $http) => {
  var info = {};
  var delay = $q.defer();

  function copyInfo(data, info) {
    angular.copy(data, info);

    info.listProviderIds = (spi) => {
      var providers = info.providers[spi].providers;
      var ids = Object.keys(providers);
      ids.sort((a, b) => {
        var s1;
        var s2;

        if (providers[a].order !== providers[b].order) {
          s1 = providers[b].order;
          s2 = providers[a].order;
        } else {
          s1 = a;
          s2 = b;
        }

        if (s1 < s2) {
          return -1;
        } else if (s1 > s2) {
          return 1;
        } else {
          return 0;
        }
      });
      return ids;
    };

    info.featureEnabled = (provider) =>
      info.profileInfo.disabledFeatures.indexOf(provider) === -1;
  }

  $http.get(`${authUrl}/admin/serverinfo`).then((response) => {
    copyInfo(response.data, info);
    delay.resolve(info);
  });

  return {
    get: () => info,
    reload: () => {
      $http.get(`${authUrl}/admin/serverinfo`).then((response) => {
        copyInfo(response.data, info);
      });
    },
    promise: delay.promise,
  };
});

module.factory('ClientInitialAccess', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients-initial-access/:id`, {
    realm: '@realm',
    id: '@id',
  }),
);

module.factory('ClientProtocolMapper', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/protocol-mappers/models/:id`,
    {
      realm: '@realm',
      client: '@client',
      id: '@id',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientScopeProtocolMapper', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/protocol-mappers/models/:id`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
      id: '@id',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('User', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId`,
    {
      realm: '@realm',
      userId: '@userId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.service('UserSearchState', function () {
  this.isFirstSearch = true;
  this.query = {
    max: 20,
    first: 0,
  };
});

module.service('ClientListSearchState', function () {
  this.isFirstSearch = true;
  this.query = {
    max: 20,
    first: 0,
    search: true,
  };
});

// Service tracks the last flow selected in Authentication-->Flows tab
module.service('LastFlowSelected', function () {
  this.alias = null;
});

module.service('RealmRoleRemover', function () {
  this.remove = (role, realm, Dialog, $location, Notifications) => {
    Dialog.confirmDelete(role.name, 'role', () => {
      role.$remove(
        {
          realm: realm.realm,
          role: role.id,
        },
        () => {
          $location.url(`/realms/${realm.realm}/roles`);
          Notifications.success('The role has been deleted.');
        },
      );
    });
  };
});

module.factory('UserSessionStats', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/session-stats`, {
    realm: '@realm',
    user: '@user',
  }),
);
module.factory('UserSessions', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/sessions`, {
    realm: '@realm',
    user: '@user',
  }),
);
module.factory('UserOfflineSessions', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:user/offline-sessions/:client`,
    {
      realm: '@realm',
      user: '@user',
      client: '@client',
    },
  ),
);

module.factory('UserSessionLogout', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/sessions/:session`, {
    realm: '@realm',
    session: '@session',
  }),
);

module.factory('UserLogout', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/logout`, {
    realm: '@realm',
    user: '@user',
  }),
);

module.factory('UserFederatedIdentities', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/federated-identity`, {
    realm: '@realm',
    user: '@user',
  }),
);
module.factory('UserFederatedIdentity', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:user/federated-identity/:provider`,
    {
      realm: '@realm',
      user: '@user',
      provider: '@provider',
    },
  ),
);

module.factory('UserConsents', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/consents/:client`, {
    realm: '@realm',
    user: '@user',
    client: '@client',
  }),
);

module.factory('UserImpersonation', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:user/impersonation`, {
    realm: '@realm',
    user: '@user',
  }),
);

module.factory('UserCredentials', ($resource) => {
  var credentials = {};

  credentials.getCredentials = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/credentials`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ).query;

  credentials.getConfiguredUserStorageCredentialTypes = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/configured-user-storage-credential-types`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ).query;

  credentials.deleteCredential = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/credentials/:credentialId`,
    {
      realm: '@realm',
      userId: '@userId',
      credentialId: '@credentialId',
    },
  ).delete;

  credentials.updateCredentialLabel = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/credentials/:credentialId/userLabel`,
    {
      realm: '@realm',
      userId: '@userId',
      credentialId: '@credentialId',
    },
    {
      update: {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        transformRequest: (credential, _getHeaders) => credential.userLabel,
      },
    },
  ).update;

  credentials.resetPassword = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/reset-password`,
    {
      realm: '@realm',
      userId: '@userId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ).update;

  credentials.removeTotp = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/remove-totp`,
    {
      realm: '@realm',
      userId: '@userId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ).update;

  credentials.disableCredentialTypes = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/disable-credential-types`,
    {
      realm: '@realm',
      userId: '@userId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ).update;

  credentials.moveCredentialAfter = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/credentials/:credentialId/moveAfter/:newPreviousCredentialId`,
    {
      realm: '@realm',
      userId: '@userId',
      credentialId: '@credentialId',
      newPreviousCredentialId: '@newPreviousCredentialId',
    },
    {
      update: {
        method: 'POST',
      },
    },
  ).update;

  credentials.moveToFirst = $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/credentials/:credentialId/moveToFirst`,
    {
      realm: '@realm',
      userId: '@userId',
      credentialId: '@credentialId',
    },
    {
      update: {
        method: 'POST',
      },
    },
  ).update;

  return credentials;
});

module.factory('UserExecuteActionsEmail', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/execute-actions-email`,
    {
      realm: '@realm',
      userId: '@userId',
      lifespan: '@lifespan',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/realm`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ),
);

module.factory('CompositeRealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/realm/composite`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ),
);

module.factory('AvailableRealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/realm/available`,
    {
      realm: '@realm',
      userId: '@userId',
    },
  ),
);

module.factory('ClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/clients/:client`,
    {
      realm: '@realm',
      userId: '@userId',
      client: '@client',
    },
  ),
);

module.factory('AvailableClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/clients/:client/available`,
    {
      realm: '@realm',
      userId: '@userId',
      client: '@client',
    },
  ),
);

module.factory('CompositeClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/role-mappings/clients/:client/composite`,
    {
      realm: '@realm',
      userId: '@userId',
      client: '@client',
    },
  ),
);

module.factory('ClientRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/realm`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientAvailableRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/realm/available`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientCompositeRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/realm/composite`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient`,
    {
      realm: '@realm',
      client: '@client',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('ClientAvailableClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient/available`,
    {
      realm: '@realm',
      client: '@client',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('ClientCompositeClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient/composite`,
    {
      realm: '@realm',
      client: '@client',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('RealmRoles', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/roles`, {
    realm: '@realm',
  }),
);

module.factory('RoleRealmComposites', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/roles-by-id/:role/composites/realm`,
    {
      realm: '@realm',
      role: '@role',
    },
  ),
);

module.factory('RealmPushRevocation', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/push-revocation`, {
    realm: '@realm',
  }),
);

module.factory('RealmClearUserCache', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clear-user-cache`, {
    realm: '@realm',
  }),
);

module.factory('RealmClearRealmCache', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clear-realm-cache`, {
    realm: '@realm',
  }),
);

module.factory('RealmClearKeysCache', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clear-keys-cache`, {
    realm: '@realm',
  }),
);

module.factory('RealmSessionStats', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/session-stats`, {
    realm: '@realm',
  }),
);

module.factory('RealmClientSessionStats', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/client-session-stats`, {
    realm: '@realm',
  }),
);

module.factory('RoleClientComposites', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/roles-by-id/:role/composites/clients/:client`,
    {
      realm: '@realm',
      role: '@role',
      client: '@client',
    },
  ),
);

function clientSelectControl($scope, realm, Client) {
  $scope.clientsUiSelect = {
    minimumInputLength: 0,
    delay: 500,
    allowClear: true,
    query: (query) => {
      var data = { results: [] };
      Client.query(
        { realm: realm, search: true, clientId: query.term.trim(), max: 20 },
        (response) => {
          data.results = response;
          query.callback(data);
        },
      );
    },
    formatResult: (object, _container, _query) => {
      object.text = object.clientId;
      return object.clientId;
    },
  };
}

function _roleControl(
  $scope,
  $route,
  realm,
  role,
  roles,
  Client,
  ClientRole,
  RoleById,
  RoleRealmComposites,
  RoleClientComposites,
  $http,
  $location,
  Notifications,
  _Dialog,
  ComponentUtils,
) {
  $scope.$watch(
    () => $location.path(),
    () => {
      $scope.path = $location.path().substring(1).split('/');
    },
  );

  $scope.$watch(
    'role',
    () => {
      if (!angular.equals($scope.role, role)) {
        $scope.changed = true;
      }
    },
    true,
  );

  $scope.update = () => {
    RoleById.update(
      {
        realm: realm.realm,
        role: role.id,
      },
      $scope.role,
      () => {
        $scope.changed = false;
        role = angular.copy($scope.role);
        Notifications.success('Your changes have been saved to the role.');
      },
    );
  };

  $scope.reset = () => {
    $scope.role = angular.copy(role);
    $scope.changed = false;
  };

  if (!role.id) return;

  $scope.compositeSwitch = role.composite;
  $scope.compositeSwitchDisabled = role.composite;
  $scope.realmRoles = angular.copy(roles);
  $scope.selectedRealmRoles = [];
  $scope.selectedRealmMappings = [];
  $scope.realmMappings = [];
  $scope.clientRoles = [];
  $scope.selectedClientRoles = [];
  $scope.selectedClientMappings = [];
  $scope.clientMappings = [];

  for (var j = 0; j < $scope.realmRoles.length; j++) {
    if ($scope.realmRoles[j].id === role.id) {
      var realmRole = $scope.realmRoles[j];
      var idx = $scope.realmRoles.indexOf(realmRole);
      $scope.realmRoles.splice(idx, 1);
      break;
    }
  }

  clientSelectControl($scope, $route.current.params.realm, Client);

  $scope.selectedClient = null;

  $scope.realmMappings = RoleRealmComposites.query(
    { realm: realm.realm, role: role.id },
    () => {
      for (var i = 0; i < $scope.realmMappings.length; i++) {
        var role = $scope.realmMappings[i];
        for (var j = 0; j < $scope.realmRoles.length; j++) {
          var realmRole = $scope.realmRoles[j];
          if (realmRole.id === role.id) {
            var idx = $scope.realmRoles.indexOf(realmRole);
            if (idx !== -1) {
              $scope.realmRoles.splice(idx, 1);
              break;
            }
          }
        }
      }
    },
  );

  $scope.addRealmRole = () => {
    $scope.compositeSwitchDisabled = true;
    $scope.selectedRealmRolesToAdd = JSON.parse(
      `[${$scope.selectedRealmRoles}]`,
    );
    $http
      .post(
        `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${role.id}/composites`,
        $scope.selectedRealmRolesToAdd,
      )
      .then(() => {
        for (var i = 0; i < $scope.selectedRealmRolesToAdd.length; i++) {
          var role = $scope.selectedRealmRolesToAdd[i];
          var idx = ComponentUtils.findIndexById($scope.realmRoles, role.id);
          if (idx !== -1) {
            $scope.realmRoles.splice(idx, 1);
            $scope.realmMappings.push(role);
          }
        }
        $scope.selectedRealmRoles = [];
        $scope.selectedRealmRolesToAdd = [];
        Notifications.success('Role added to composite.');
      });
  };

  $scope.deleteRealmRole = () => {
    $scope.compositeSwitchDisabled = true;
    $scope.selectedRealmMappingsToRemove = JSON.parse(
      `[${$scope.selectedRealmMappings}]`,
    );
    $http
      .delete(
        `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${role.id}/composites`,
        {
          data: $scope.selectedRealmMappingsToRemove,
          headers: { 'content-type': 'application/json' },
        },
      )
      .then(() => {
        for (var i = 0; i < $scope.selectedRealmMappingsToRemove.length; i++) {
          var role = $scope.selectedRealmMappingsToRemove[i];
          var idx = ComponentUtils.findIndexById($scope.realmMappings, role.id);
          if (idx !== -1) {
            $scope.realmMappings.splice(idx, 1);
            $scope.realmRoles.push(role);
          }
        }
        $scope.selectedRealmMappings = [];
        $scope.selectedRealmMappingsToRemove = [];
        Notifications.success('Role removed from composite.');
      });
  };

  $scope.addClientRole = () => {
    $scope.compositeSwitchDisabled = true;
    $scope.selectedClientRolesToAdd = JSON.parse(
      `[${$scope.selectedClientRoles}]`,
    );
    $http
      .post(
        `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${role.id}/composites`,
        $scope.selectedClientRolesToAdd,
      )
      .then(() => {
        for (var i = 0; i < $scope.selectedClientRolesToAdd.length; i++) {
          var role = $scope.selectedClientRolesToAdd[i];
          var idx = ComponentUtils.findIndexById($scope.clientRoles, role.id);
          if (idx !== -1) {
            $scope.clientRoles.splice(idx, 1);
            $scope.clientMappings.push(role);
          }
        }
        $scope.selectedClientRoles = [];
        $scope.selectedClientRolesToAdd = [];
        Notifications.success('Client role added.');
      });
  };

  $scope.deleteClientRole = () => {
    $scope.compositeSwitchDisabled = true;
    $scope.selectedClientMappingsToRemove = JSON.parse(
      `[${$scope.selectedClientMappings}]`,
    );
    $http
      .delete(
        `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${role.id}/composites`,
        {
          data: $scope.selectedClientMappingsToRemove,
          headers: { 'content-type': 'application/json' },
        },
      )
      .then(() => {
        for (var i = 0; i < $scope.selectedClientMappingsToRemove.length; i++) {
          var role = $scope.selectedClientMappingsToRemove[i];
          var idx = ComponentUtils.findIndexById(
            $scope.clientMappings,
            role.id,
          );
          if (idx !== -1) {
            $scope.clientMappings.splice(idx, 1);
            $scope.clientRoles.push(role);
          }
        }
        $scope.selectedClientMappings = [];
        $scope.selectedClientMappingsToRemove = [];
        Notifications.success('Client role removed.');
      });
  };

  $scope.changeClient = (client) => {
    console.log('selected client: ', client);
    if (!client?.id) {
      $scope.selectedClient = null;
      return;
    }
    $scope.selectedClient = client;
    $scope.clientRoles = ClientRole.query(
      { realm: realm.realm, client: client.id },
      () => {
        $scope.clientMappings = RoleClientComposites.query(
          { realm: realm.realm, role: role.id, client: client.id },
          () => {
            for (var i = 0; i < $scope.clientMappings.length; i++) {
              var role = $scope.clientMappings[i];
              for (var j = 0; j < $scope.clientRoles.length; j++) {
                var realmRole = $scope.clientRoles[j];
                if (realmRole.id === role.id) {
                  var idx = $scope.clientRoles.indexOf(realmRole);
                  if (idx !== -1) {
                    $scope.clientRoles.splice(idx, 1);
                    break;
                  }
                }
              }
            }
          },
        );
        for (var j = 0; j < $scope.clientRoles.length; j++) {
          if ($scope.clientRoles[j] === role.id) {
            var appRole = $scope.clientRoles[j];
            var idx = $scope.clientRoles.indexof(appRole);
            $scope.clientRoles.splice(idx, 1);
            break;
          }
        }
      },
    );
  };
}

module.factory('Role', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/roles/:role`,
    {
      realm: '@realm',
      role: '@role',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RoleById', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/roles-by-id/:role`,
    {
      realm: '@realm',
      role: '@role',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientRole', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/roles/:role`,
    {
      realm: '@realm',
      client: '@client',
      role: '@role',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientDefaultClientScopes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/default-client-scopes/:clientScopeId`,
    {
      realm: '@realm',
      client: '@client',
      clientScopeId: '@clientScopeId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientOptionalClientScopes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/optional-client-scopes/:clientScopeId`,
    {
      realm: '@realm',
      client: '@client',
      clientScopeId: '@clientScopeId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientEvaluateProtocolMappers', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/evaluate-scopes/protocol-mappers?scope=:scopeParam`,
    {
      realm: '@realm',
      client: '@client',
      scopeParam: '@scopeParam',
    },
  ),
);

module.factory('ClientEvaluateGrantedRoles', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/evaluate-scopes/scope-mappings/:roleContainer/granted?scope=:scopeParam`,
    {
      realm: '@realm',
      client: '@client',
      roleContainer: '@roleContainer',
      scopeParam: '@scopeParam',
    },
  ),
);

module.factory('ClientEvaluateNotGrantedRoles', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/evaluate-scopes/scope-mappings/:roleContainer/not-granted?scope=:scopeParam`,
    {
      realm: '@realm',
      client: '@client',
      roleContainer: '@roleContainer',
      scopeParam: '@scopeParam',
    },
  ),
);

module.factory('ClientEvaluateGenerateExampleAccessToken', (_$resource) =>
  buildClientEvaluateGenerateExampleUrl('generate-example-access-token'),
);

module.factory('ClientEvaluateGenerateExampleIDToken', (_$resource) =>
  buildClientEvaluateGenerateExampleUrl('generate-example-id-token'),
);

module.factory('ClientEvaluateGenerateExampleUserInfo', (_$resource) =>
  buildClientEvaluateGenerateExampleUrl('generate-example-userinfo'),
);

function buildClientEvaluateGenerateExampleUrl(subPath) {
  var urlTemplate = `${authUrl}/admin/realms/:realm/clients/:client/evaluate-scopes/${subPath}?scope=:scopeParam&userId=:userId`;
  return {
    url: (parameters) =>
      urlTemplate
        .replace(':realm', parameters.realm)
        .replace(':client', parameters.client)
        .replace(':scopeParam', parameters.scopeParam)
        .replace(':userId', parameters.userId),
  };
}

module.factory('ClientProtocolMappersByProtocol', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/protocol-mappers/protocol/:protocol`,
    {
      realm: '@realm',
      client: '@client',
      protocol: '@protocol',
    },
  ),
);

module.factory('ClientScopeProtocolMappersByProtocol', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/protocol-mappers/protocol/:protocol`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
      protocol: '@protocol',
    },
  ),
);

module.factory('ClientScopeRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/realm`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
    },
  ),
);

module.factory('ClientScopeAvailableRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/realm/available`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
    },
  ),
);

module.factory('ClientScopeCompositeRealmScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/realm/composite`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
    },
  ),
);

module.factory('ClientScopeClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/clients/:targetClient`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('ClientScopeAvailableClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/clients/:targetClient/available`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('ClientScopeCompositeClientScopeMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope/scope-mappings/clients/:targetClient/composite`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
      targetClient: '@targetClient',
    },
  ),
);

module.factory('ClientSessionStats', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/session-stats`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientSessionStatsWithUsers', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/session-stats?users=true`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientSessionCount', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/session-count`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientUserSessions', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/user-sessions`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientOfflineSessionCount', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/offline-session-count`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientOfflineSessions', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/offline-sessions`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('RealmLogoutAll', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/logout-all`, {
    realm: '@realm',
  }),
);

module.factory('ClientPushRevocation', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/push-revocation`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientClusterNode', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/nodes/:node`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientTestNodesAvailable', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/test-nodes-available`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('ClientCertificate', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/certificates/:attribute`,
    {
      realm: '@realm',
      client: '@client',
      attribute: '@attribute',
    },
  ),
);

module.factory('ClientCertificateGenerate', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/certificates/:attribute/generate`,
    {
      realm: '@realm',
      client: '@client',
      attribute: '@attribute',
    },
    {
      generate: {
        method: 'POST',
      },
    },
  ),
);

module.factory('ClientCertificateDownload', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/certificates/:attribute/download`,
    {
      realm: '@realm',
      client: '@client',
      attribute: '@attribute',
    },
    {
      download: {
        method: 'POST',
        responseType: 'arraybuffer',
      },
    },
  ),
);

module.factory('Client', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client`,
    {
      realm: '@realm',
      client: '@client',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientScope', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-scopes/:clientScope`,
    {
      realm: '@realm',
      clientScope: '@clientScope',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RealmDefaultClientScopes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/default-default-client-scopes/:clientScopeId`,
    {
      realm: '@realm',
      clientScopeId: '@clientScopeId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('RealmOptionalClientScopes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/default-optional-client-scopes/:clientScopeId`,
    {
      realm: '@realm',
      clientScopeId: '@clientScopeId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('ClientDescriptionConverter', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/client-description-converter`, {
    realm: '@realm',
  }),
);

/*
module.factory('ClientInstallation', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/installation/providers/:provider', {
        realm : '@realm',
        client : '@client',
        provider : '@provider'
    });
});
*/

module.factory('ClientInstallation', (_$resource) => {
  var url = `${authUrl}/admin/realms/:realm/clients/:client/installation/providers/:provider`;
  return {
    url: (parameters) =>
      url
        .replace(':realm', parameters.realm)
        .replace(':client', parameters.client)
        .replace(':provider', parameters.provider),
  };
});

module.factory('ClientInstallationJBoss', (_$resource) => {
  var url = `${authUrl}/admin/realms/:realm/clients/:client/installation/jboss`;
  return {
    url: (parameters) =>
      url
        .replace(':realm', parameters.realm)
        .replace(':client', parameters.client),
  };
});

module.factory('ClientSecret', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/client-secret`,
    {
      realm: '@realm',
      client: '@client',
    },
    {
      update: {
        method: 'POST',
      },
    },
  ),
);

module.factory('ClientRegistrationAccessToken', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/registration-access-token`,
    {
      realm: '@realm',
      client: '@client',
    },
    {
      update: {
        method: 'POST',
      },
    },
  ),
);

module.factory('ClientOrigins', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/allowed-origins`,
    {
      realm: '@realm',
      client: '@client',
    },
    {
      update: {
        method: 'PUT',
        isArray: true,
      },
    },
  ),
);

module.factory('ClientServiceAccountUser', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/service-account-user`,
    {
      realm: '@realm',
      client: '@client',
    },
  ),
);

module.factory('Current', (Realm, $route, $rootScope) => {
  var current = {
    realms: {},
    realm: null,
  };

  $rootScope.$on('$routeChangeStart', () => {
    current.realms = Realm.query(null, (realms) => {
      var currentRealm = null;
      if ($route.current.params.realm) {
        for (var i = 0; i < realms.length; i++) {
          if (realms[i].realm === $route.current.params.realm) {
            currentRealm = realms[i];
          }
        }
      }
      current.realm = currentRealm;
    });
  });

  return current;
});

module.factory('TimeUnit', () => {
  var t = {};

  t.autoUnit = (time) => {
    if (!time) {
      return 'Hours';
    }

    var unit = 'Seconds';
    if (time % 60 === 0) {
      unit = 'Minutes';
      time = time / 60;
    }
    if (time % 60 === 0) {
      unit = 'Hours';
      time = time / 60;
    }
    if (time % 24 === 0) {
      unit = 'Days';
      time = time / 24;
    }
    return unit;
  };

  t.toSeconds = (time, unit) => {
    switch (unit) {
      case 'Seconds':
        return time;
      case 'Minutes':
        return time * 60;
      case 'Hours':
        return time * 3600;
      case 'Days':
        return time * 86400;
      default:
        throw `invalid unit ${unit}`;
    }
  };

  t.toUnit = (time, unit) => {
    switch (unit) {
      case 'Seconds':
        return time;
      case 'Minutes':
        return Math.ceil(time / 60);
      case 'Hours':
        return Math.ceil(time / 3600);
      case 'Days':
        return Math.ceil(time / 86400);
      default:
        throw `invalid unit ${unit}`;
    }
  };

  return t;
});

module.factory('TimeUnit2', () => {
  var t = {};

  t.asUnit = (time) => {
    var unit = 'Minutes';

    if (time) {
      if (time === -1) {
        time = -1;
      } else {
        if (time < 60) {
          time = 60;
        }

        if (time % 60 === 0) {
          unit = 'Minutes';
          time = time / 60;
        }
        if (time % 60 === 0) {
          unit = 'Hours';
          time = time / 60;
        }
        if (time % 24 === 0) {
          unit = 'Days';
          time = time / 24;
        }
      }
    }

    var v = {
      unit: unit,
      time: time,
      toSeconds: () => {
        switch (v.unit) {
          case 'Minutes':
            return v.time * 60;
          case 'Hours':
            return v.time * 3600;
          case 'Days':
            return v.time * 86400;
        }
      },
    };

    return v;
  };

  return t;
});

module.filter('removeSelectedPolicies', () => (policies, selectedPolicies) => {
  var result = [];
  for (var i in policies) {
    var policy = policies[i];
    var policyAvailable = true;
    for (var j in selectedPolicies) {
      if (policy.id === selectedPolicies[j].id && !policy.multipleSupported) {
        policyAvailable = false;
      }
    }
    if (policyAvailable) {
      result.push(policy);
    }
  }
  return result;
});

module.factory('IdentityProvider', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/identity-provider/instances/:alias`,
    {
      realm: '@realm',
      alias: '@alias',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('IdentityProviderExport', (_$resource) => {
  var url = `${authUrl}/admin/realms/:realm/identity-provider/instances/:alias/export`;
  return {
    url: (parameters) =>
      url
        .replace(':realm', parameters.realm)
        .replace(':alias', parameters.alias),
  };
});

module.factory('IdentityProviderFactory', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/identity-provider/providers/:provider_id`,
    {
      realm: '@realm',
      provider_id: '@provider_id',
    },
  ),
);

module.factory('IdentityProviderMapperTypes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/identity-provider/instances/:alias/mapper-types`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('IdentityProviderMappers', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/identity-provider/instances/:alias/mappers`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('IdentityProviderMapper', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/identity-provider/instances/:alias/mappers/:mapperId`,
    {
      realm: '@realm',
      alias: '@alias',
      mapperId: '@mapperId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('AuthenticationFlowExecutions', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/flows/:alias/executions`,
    {
      realm: '@realm',
      alias: '@alias',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('CreateExecutionFlow', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/flows/:alias/executions/flow`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('CreateExecution', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/flows/:alias/executions/execution`,
    {
      realm: '@realm',
      alias: '@alias',
    },
  ),
);

module.factory('AuthenticationFlows', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/authentication/flows/:flow`, {
    realm: '@realm',
    flow: '@flow',
  }),
);

module.factory('AuthenticationFormProviders', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/authentication/form-providers`, {
    realm: '@realm',
  }),
);

module.factory('AuthenticationFormActionProviders', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/form-action-providers`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('AuthenticatorProviders', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/authenticator-providers`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('ClientAuthenticatorProviders', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/client-authenticator-providers`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('AuthenticationFlowsCopy', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/authentication/flows/:alias/copy`, {
    realm: '@realm',
    alias: '@alias',
  }),
);

module.factory('AuthenticationFlowsUpdate', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/flows/:flow`,
    {
      realm: '@realm',
      flow: '@flow',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('AuthenticationConfigDescription', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/config-description/:provider`,
    {
      realm: '@realm',
      provider: '@provider',
    },
  ),
);
module.factory('PerClientAuthenticationConfigDescription', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/per-client-config-description`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('AuthenticationConfig', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/config/:config`,
    {
      realm: '@realm',
      config: '@config',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);
module.factory('AuthenticationExecutionConfig', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/executions/:execution/config`,
    {
      realm: '@realm',
      execution: '@execution',
    },
  ),
);

module.factory('AuthenticationExecution', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/executions/:execution`,
    {
      realm: '@realm',
      execution: '@execution',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('AuthenticationExecutionRaisePriority', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/executions/:execution/raise-priority`,
    {
      realm: '@realm',
      execution: '@execution',
    },
  ),
);

module.factory('AuthenticationExecutionLowerPriority', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/authentication/executions/:execution/lower-priority`,
    {
      realm: '@realm',
      execution: '@execution',
    },
  ),
);

module.service('SelectRoleDialog', ($modal) => {
  var dialog = {};

  var openDialog = (title, message, btns) => {
    var controller = ($scope, $modalInstance, title, message, btns) => {
      $scope.title = title;
      $scope.message = message;
      $scope.btns = btns;

      $scope.ok = () => {
        $modalInstance.close();
      };
      $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
      };
    };

    return $modal.open({
      templateUrl: `${resourceUrl}/templates/kc-modal.html`,
      controller: controller,
      resolve: {
        title: () => title,
        message: () => message,
        btns: () => btns,
      },
    }).result;
  };

  var escapeHtml = (str) => {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  dialog.confirmDelete = (name, type, success) => {
    var title = `Delete ${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}`;
    var msg = `Are you sure you want to permanently delete the ${type} ${name}?`;
    var btns = {
      ok: {
        label: 'Delete',
        cssClass: 'btn btn-danger',
      },
      cancel: {
        label: 'Cancel',
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, msg, btns).then(success);
  };

  dialog.confirmGenerateKeys = (name, _type, success) => {
    var title = 'Generate new keys for realm';
    var msg = `Are you sure you want to permanently generate new keys for ${name}?`;
    var btns = {
      ok: {
        label: 'Generate Keys',
        cssClass: 'btn btn-danger',
      },
      cancel: {
        label: 'Cancel',
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, msg, btns).then(success);
  };

  dialog.confirm = (title, message, success, cancel) => {
    var btns = {
      ok: {
        label: title,
        cssClass: 'btn btn-danger',
      },
      cancel: {
        label: 'Cancel',
        cssClass: 'btn btn-default',
      },
    };

    openDialog(title, message, btns).then(success, cancel);
  };

  return dialog;
});

module.factory('Group', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId`,
    {
      realm: '@realm',
      userId: '@groupId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('GroupChildren', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/groups/:groupId/children`, {
    realm: '@realm',
    groupId: '@groupId',
  }),
);

module.factory('GroupsCount', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/count`,
    {
      realm: '@realm',
    },
    {
      query: {
        isArray: false,
        method: 'GET',
        params: {},
        transformResponse: (data) => angular.fromJson(data),
      },
    },
  ),
);

module.factory('Groups', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/groups`, {
    realm: '@realm',
  }),
);

module.factory('GroupRealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/realm`,
    {
      realm: '@realm',
      groupId: '@groupId',
    },
  ),
);

module.factory('GroupCompositeRealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/realm/composite`,
    {
      realm: '@realm',
      groupId: '@groupId',
    },
  ),
);

module.factory('GroupAvailableRealmRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/realm/available`,
    {
      realm: '@realm',
      groupId: '@groupId',
    },
  ),
);

module.factory('GroupClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client`,
    {
      realm: '@realm',
      groupId: '@groupId',
      client: '@client',
    },
  ),
);

module.factory('GroupAvailableClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client/available`,
    {
      realm: '@realm',
      groupId: '@groupId',
      client: '@client',
    },
  ),
);

module.factory('GroupCompositeClientRoleMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client/composite`,
    {
      realm: '@realm',
      groupId: '@groupId',
      client: '@client',
    },
  ),
);

module.factory('GroupMembership', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/groups/:groupId/members`, {
    realm: '@realm',
    groupId: '@groupId',
  }),
);

module.factory('RoleList', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/roles`, {
    realm: '@realm',
  }),
);

module.factory('RoleMembership', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/roles/:role/users`, {
    realm: '@realm',
    role: '@role',
  }),
);

module.factory('ClientRoleList', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/clients/:client/roles`, {
    realm: '@realm',
    client: '@client',
  }),
);

module.factory('ClientRoleMembership', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/clients/:client/roles/:role/users`,
    {
      realm: '@realm',
      client: '@client',
      role: '@role',
    },
  ),
);

module.factory('UserGroupMembership', ($resource) =>
  $resource(`${authUrl}/admin/realms/:realm/users/:userId/groups`, {
    realm: '@realm',
    userId: '@userId',
  }),
);

module.factory('UserGroupMapping', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/groups/:groupId`,
    {
      realm: '@realm',
      userId: '@userId',
      groupId: '@groupId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('DefaultGroups', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/default-groups/:groupId`,
    {
      realm: '@realm',
      groupId: '@groupId',
    },
    {
      update: {
        method: 'PUT',
      },
    },
  ),
);

module.factory('SubComponentTypes', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/components/:componentId/sub-component-types`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  ),
);

module.factory('Components', ($resource, ComponentUtils) =>
  $resource(
    `${authUrl}/admin/realms/:realm/components/:componentId`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
    {
      update: {
        method: 'PUT',
        transformRequest: (componentInstance) => {
          if (componentInstance.config) {
            ComponentUtils.removeLastEmptyValue(componentInstance.config);
          }

          return angular.toJson(componentInstance);
        },
      },
      save: {
        method: 'POST',
        transformRequest: (componentInstance) => {
          if (componentInstance.config) {
            ComponentUtils.removeLastEmptyValue(componentInstance.config);
          }

          return angular.toJson(componentInstance);
        },
      },
    },
  ),
);

module.factory('UserStorageOperations', ($resource) => {
  var object = {};
  object.sync = $resource(
    `${authUrl}/admin/realms/:realm/user-storage/:componentId/sync`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  );
  object.removeImportedUsers = $resource(
    `${authUrl}/admin/realms/:realm/user-storage/:componentId/remove-imported-users`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  );
  object.unlinkUsers = $resource(
    `${authUrl}/admin/realms/:realm/user-storage/:componentId/unlink-users`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  );
  object.simpleName = $resource(
    `${authUrl}/admin/realms/:realm/user-storage/:componentId/name`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  );
  return object;
});

module.factory('ClientStorageOperations', ($resource) => {
  var object = {};
  object.simpleName = $resource(
    `${authUrl}/admin/realms/:realm/client-storage/:componentId/name`,
    {
      realm: '@realm',
      componentId: '@componentId',
    },
  );
  return object;
});

module.factory('ClientRegistrationPolicyProviders', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/client-registration-policy/providers`,
    {
      realm: '@realm',
    },
  ),
);

module.factory('LDAPMapperSync', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/user-storage/:parentId/mappers/:mapperId/sync`,
    {
      realm: '@realm',
      componentId: '@componentId',
      mapperId: '@mapperId',
    },
  ),
);

module.factory('UserGroupMembershipCount', ($resource) =>
  $resource(
    `${authUrl}/admin/realms/:realm/users/:userId/groups/count`,
    {
      realm: '@realm',
      userId: '@userId',
    },
    {
      query: {
        isArray: false,
        method: 'GET',
        params: {},
        transformResponse: (data) => angular.fromJson(data),
      },
    },
  ),
);

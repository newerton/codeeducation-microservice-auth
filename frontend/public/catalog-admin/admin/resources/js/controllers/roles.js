module.controller(
  'RoleMembersCtrl',
  (
    $scope,
    realm,
    role,
    RoleMembership,
    Dialog,
    Notifications,
    $location,
    RealmRoleRemover,
  ) => {
    $scope.realm = realm;
    $scope.page = 0;
    $scope.role = role;

    $scope.query = {
      realm: realm.realm,
      role: role.name,
      max: 5,
      first: 0,
    };

    $scope.remove = () => {
      RealmRoleRemover.remove(
        $scope.role,
        realm,
        Dialog,
        $location,
        Notifications,
      );
    };

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = () => {
      console.log(`query.search: ${$scope.query.search}`);
      $scope.searchLoaded = false;

      $scope.users = RoleMembership.query($scope.query, () => {
        console.log('search loaded');
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
      });
    };

    $scope.searchQuery();
  },
);

<#import "layout.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "child">
      Login title
    </#if>
</@layout.registrationLayout>
<script src="${url.resourcesCommonPath}/../catalog-admin/js/runtime-login.cc85cbe0.js"></script><script src="${url.resourcesCommonPath}/../catalog-admin/js/login.aa5bf127.chunk.js"></script>
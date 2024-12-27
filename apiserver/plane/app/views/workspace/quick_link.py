# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import (WorkspaceUserLink, Workspace)
from plane.app.serializers import WorkspaceUserLinkSerializer
from ..base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE

class QuickLinkViewSet(BaseViewSet): 
    model = WorkspaceUserLink

    def get_serializer_class(self):
        return WorkspaceUserLinkSerializer
    
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceUserLinkSerializer(data=request.data)        
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        quick_link = WorkspaceUserLink.objects.filter(pk=pk).first()
        serializer = WorkspaceUserLinkSerializer(quick_link, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        

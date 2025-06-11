package com.it.melody.service;

import com.it.melody.pojo.Playlist;

import java.util.List;

public interface PlaylistServce {
    List<Playlist> getPlaylist(int id);
}
